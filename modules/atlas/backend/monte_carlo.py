import numpy as np
import pandas as pd
import yfinance as yf

PATH_SAMPLE_SIZE = 200
VALID_LOOKBACK_DAYS = {180, 365, 730}


def _download_prices(ticker: str, start: pd.Timestamp, end: pd.Timestamp) -> pd.Series:
    data = yf.download(
        ticker,
        start=start.strftime("%Y-%m-%d"),
        end=(end + pd.Timedelta(days=1)).strftime("%Y-%m-%d"),
        auto_adjust=True,
        progress=False,
    )["Close"]

    if isinstance(data, pd.Series):
        stock_data = data
    else:
        stock_data = data.iloc[:, 0]

    stock_data = stock_data.dropna()
    if stock_data.empty:
        raise ValueError(f"No price data returned for {ticker}")

    return stock_data


def run_monte_carlo(
    ticker: str,
    num_simulations: int,
    num_days: int,
    lookback_days: int,
) -> dict:
    if lookback_days not in VALID_LOOKBACK_DAYS:
        raise ValueError("Invalid lookback period")

    end_date = pd.Timestamp.now()
    start_date = end_date - pd.Timedelta(days=lookback_days)
    stock_data = _download_prices(ticker, start_date, end_date)

    log_returns = np.log(stock_data).diff().dropna()
    if log_returns.empty:
        raise ValueError(f"Insufficient return history for {ticker}")

    mu = float(log_returns.mean())
    sigma = float(np.sqrt(log_returns.to_frame().cov().iloc[0, 0]))
    initial_price = float(stock_data.iloc[-1])

    drift = mu - 0.5 * sigma**2
    shocks = np.random.normal(0, sigma, (num_simulations, num_days - 1))
    log_returns_sim = drift + shocks

    prices = np.zeros((num_simulations, num_days))
    prices[:, 0] = initial_price

    for day in range(1, num_days):
        prices[:, day] = prices[:, day - 1] * np.exp(log_returns_sim[:, day - 1])

    terminal_prices = prices[:, -1]
    median_path = np.percentile(prices, 50, axis=0)

    if num_simulations <= PATH_SAMPLE_SIZE:
        sampled_paths = prices
    else:
        sample_indices = np.random.choice(
            num_simulations, size=PATH_SAMPLE_SIZE, replace=False
        )
        sampled_paths = prices[sample_indices]

    def round_values(values):
        return [round(float(value), 2) for value in values]

    expected_price = float(terminal_prices.mean())

    return {
        "ticker": ticker.upper(),
        "current_price": round(initial_price, 2),
        "expected_price": round(expected_price, 2),
        "expected_return": round((expected_price - initial_price) / initial_price, 4),
        "upside_probability": round(float((terminal_prices > initial_price).mean()), 4),
        "downside_probability": round(float((terminal_prices < initial_price).mean()), 4),
        "percentiles": {
            "5th": round(float(np.percentile(terminal_prices, 5)), 2),
            "10th": round(float(np.percentile(terminal_prices, 10)), 2),
            "25th": round(float(np.percentile(terminal_prices, 25)), 2),
            "50th": round(float(np.percentile(terminal_prices, 50)), 2),
            "75th": round(float(np.percentile(terminal_prices, 75)), 2),
            "90th": round(float(np.percentile(terminal_prices, 90)), 2),
            "95th": round(float(np.percentile(terminal_prices, 95)), 2),
        },
        "simulation_paths": [round_values(path) for path in sampled_paths],
        "median_path": round_values(median_path),
        "terminal_prices": round_values(terminal_prices),
        "num_simulations": num_simulations,
        "num_days": num_days,
    }
