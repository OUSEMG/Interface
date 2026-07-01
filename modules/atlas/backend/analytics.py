from datetime import datetime

import numpy as np
import pandas as pd
import yfinance as yf
from scipy import stats

# SWAP POINT: Replace yfinance downloads with Bloomberg BLPAPI in production.
RISK_FREE_RATE = 0.0435
TRADING_DAYS = 252
ROLLING_WINDOW = 30

PORTFOLIO_NAME = "OUSEMG Core"
PORTFOLIO_WEIGHTS = {
    "AAPL": 0.15,
    "MSFT": 0.15,
    "GOOGL": 0.12,
    "AMZN": 0.12,
    "NVDA": 0.18,
    "JPM": 0.10,
    "V": 0.09,
    "UNH": 0.09,
}
BENCHMARK_TICKER = "SPY"


def _period_start(period: str, end: pd.Timestamp) -> pd.Timestamp:
    if period == "3M":
        return end - pd.DateOffset(months=3)
    if period == "6M":
        return end - pd.DateOffset(months=6)
    if period == "YTD":
        return pd.Timestamp(year=end.year, month=1, day=1)
    if period == "1Y":
        return end - pd.DateOffset(years=1)
    return pd.Timestamp("2018-01-01")


def _download_prices(tickers: list[str], start: pd.Timestamp, end: pd.Timestamp) -> pd.DataFrame:
    data = yf.download(
        tickers,
        start=start.strftime("%Y-%m-%d"),
        end=(end + pd.Timedelta(days=1)).strftime("%Y-%m-%d"),
        auto_adjust=True,
        progress=False,
    )["Close"]

    if isinstance(data, pd.Series):
        data = data.to_frame(tickers[0])

    data = data.dropna(how="all").ffill().dropna()
    return data


def _portfolio_returns(prices: pd.DataFrame, weights: dict[str, float]) -> pd.Series:
    asset_returns = prices.pct_change().dropna()
    weight_series = pd.Series(weights)
    aligned = asset_returns[weight_series.index]
    return (aligned * weight_series).sum(axis=1)


def _annualized_return(daily_returns: pd.Series) -> float:
    return float(daily_returns.mean() * TRADING_DAYS)


def _annualized_volatility(daily_returns: pd.Series) -> float:
    return float(daily_returns.std(ddof=1) * np.sqrt(TRADING_DAYS))


def _downside_deviation(daily_returns: pd.Series) -> float:
    downside = daily_returns[daily_returns < 0]
    if downside.empty:
        return 0.0
    return float(downside.std(ddof=1) * np.sqrt(TRADING_DAYS))


def _max_drawdown(daily_returns: pd.Series) -> tuple[float, pd.Series]:
    cumulative = (1 + daily_returns).cumprod()
    rolling_max = cumulative.cummax()
    drawdown = (cumulative - rolling_max) / rolling_max
    return float(drawdown.min()), drawdown


def _rolling_volatility(daily_returns: pd.Series) -> pd.Series:
    rolling = daily_returns.rolling(ROLLING_WINDOW).std(ddof=1) * np.sqrt(TRADING_DAYS)
    return rolling.dropna()


def _return_histogram(daily_returns: pd.Series) -> list[dict]:
    pct_returns = daily_returns * 100
    bins = np.arange(-4, 4.5, 0.5)
    counts, edges = np.histogram(pct_returns, bins=bins)

    histogram = []
    for index, count in enumerate(counts):
        midpoint = (edges[index] + edges[index + 1]) / 2
        histogram.append(
            {
                "bin": f"{midpoint:+.1f}%",
                "count": int(count),
                "isPositive": midpoint >= 0,
            }
        )
    return histogram


def _correlation_matrix(prices: pd.DataFrame) -> dict:
    returns = prices.pct_change().dropna()
    tickers = list(returns.columns)
    corr = returns.corr().round(2)
    matrix = [[float(corr.loc[row, col]) for col in tickers] for row in tickers]
    return {"tickers": tickers, "matrix": matrix}


def run_analysis(period: str) -> dict:
    end = pd.Timestamp(datetime.utcnow().date())
    start = _period_start(period, end)
    tickers = list(PORTFOLIO_WEIGHTS.keys())

    prices = _download_prices(tickers + [BENCHMARK_TICKER], start, end)
    portfolio_prices = prices[tickers]
    benchmark_prices = prices[BENCHMARK_TICKER]

    portfolio_returns = _portfolio_returns(portfolio_prices, PORTFOLIO_WEIGHTS)
    benchmark_returns = benchmark_prices.pct_change().dropna()

    aligned = pd.concat(
        [portfolio_returns, benchmark_returns],
        axis=1,
        join="inner",
    ).dropna()
    aligned.columns = ["portfolio", "benchmark"]

    portfolio_returns = aligned["portfolio"]
    benchmark_returns = aligned["benchmark"]

    ann_return = _annualized_return(portfolio_returns)
    ann_vol = _annualized_volatility(portfolio_returns)
    downside_dev = _downside_deviation(portfolio_returns)
    max_dd, drawdown_series = _max_drawdown(portfolio_returns)
    rolling_vol = _rolling_volatility(portfolio_returns)

    covariance = np.cov(portfolio_returns, benchmark_returns)
    beta = float(covariance[0, 1] / covariance[1, 1]) if covariance[1, 1] else 0.0

    sharpe = (ann_return - RISK_FREE_RATE) / ann_vol if ann_vol else 0.0
    sortino = (ann_return - RISK_FREE_RATE) / downside_dev if downside_dev else 0.0

    skewness = float(stats.skew(portfolio_returns, bias=False))
    kurtosis = float(stats.kurtosis(portfolio_returns, fisher=False, bias=False))

    drawdown_data = [
        {"date": date.strftime("%Y-%m-%d"), "drawdown": round(value * 100, 2)}
        for date, value in drawdown_series.items()
    ]

    rolling_vol_data = [
        {"date": date.strftime("%Y-%m-%d"), "volatility": round(value * 100, 2)}
        for date, value in rolling_vol.items()
    ]

    return {
        "portfolioName": PORTFOLIO_NAME,
        "period": period,
        "metrics": {
            "sharpe": {"value": round(sharpe, 2), "secondary": "annualized"},
            "sortino": {"value": round(sortino, 2), "secondary": "annualized"},
            "maxDrawdown": {"value": round(max_dd * 100, 2), "secondary": None},
            "annVolatility": {"value": round(ann_vol * 100, 2), "secondary": None},
            "beta": {"value": round(beta, 2), "secondary": "vs. S&P 500"},
        },
        "drawdown": drawdown_data,
        "rollingVolatility": rolling_vol_data,
        "returnDistribution": _return_histogram(portfolio_returns),
        "skewness": round(skewness, 2),
        "kurtosis": round(kurtosis, 2),
        "correlation": _correlation_matrix(portfolio_prices),
    }
