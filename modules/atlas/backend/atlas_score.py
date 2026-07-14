"""Atlas Score engine.

The Atlas Score is a 0-100 composite quality score for a single equity. It
blends six weighted pillars, each built from individually scored metrics:

    Pillar                       Weight   What it measures
    ---------------------------  ------   ------------------------------------
    Financial Health              25%     Leverage, liquidity, profitability
    Market Performance            20%     Risk-adjusted returns vs. S&P 500
    Valuation                     20%     Price paid per unit of fundamentals
    Analyst Recommendations       15%     Street consensus and target upside
    Technical Indicators          10%     Trend, momentum, mean reversion
    Earnings Quality              10%     Surprise history and growth

How a score is produced
-----------------------
1. Every raw metric (e.g. debt/equity, Sharpe ratio, RSI) is normalized to a
   0-100 sub-score using fixed, documented bounds. Two normalizers exist:

   - ``_linear_score(value, worst, best)``: 0 at ``worst``, 100 at ``best``,
     linear in between, clamped outside. ``worst > best`` inverts direction
     (used for "lower is better" metrics like P/E).
   - ``_peak_score(value, peak, tolerance)``: 100 at ``peak``, falling
     linearly to 0 once the value is ``tolerance`` away in either direction
     (used for "sweet spot" metrics like RSI and beta).

2. Each pillar averages its metric sub-scores using per-metric weights.
   Metrics with missing data are dropped and the remaining weights are
   renormalized, so one missing field never sinks a pillar.

3. The composite is the pillar-weight-average of available pillar scores,
   again renormalizing if an entire pillar has no data.

Every bound and weight below is documented in
``modules/atlas/docs/atlas_score.md``. Keep the two files in sync.

Data source: yfinance (fundamentals via ``Ticker.get_info()``, prices via
``yf.download``, EPS history via ``Ticker.earnings_history``).
# SWAP POINT: Replace yfinance with Bloomberg BLPAPI in production.
"""

from __future__ import annotations

from datetime import datetime

import numpy as np
import pandas as pd
import yfinance as yf

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

RISK_FREE_RATE = 0.0435          # Matches analytics.py; approx 3M T-bill yield.
TRADING_DAYS = 252
BENCHMARK_TICKER = "SPY"
HISTORY_LOOKBACK_DAYS = 365      # One year of daily prices for market/technical.

PILLAR_WEIGHTS = {
    "financial": 0.25,
    "market": 0.20,
    "valuation": 0.20,
    "anr": 0.15,
    "technical": 0.10,
    "earnings": 0.10,
}

PILLAR_LABELS = {
    "financial": "Financial",
    "market": "Market",
    "valuation": "Valuation",
    "anr": "ANR",
    "technical": "Technical",
    "earnings": "Earnings",
}

# Composite score -> qualitative rating label.
RATING_BANDS = [
    (85, "Exceptional"),
    (70, "Strong"),
    (55, "Balanced"),
    (40, "Caution"),
    (0, "Weak"),
]


# ---------------------------------------------------------------------------
# Normalization helpers
# ---------------------------------------------------------------------------

def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def _linear_score(value: float | None, worst: float, best: float) -> float | None:
    """Map ``value`` onto 0-100 linearly between ``worst`` and ``best``.

    Direction is implied by the bounds: pass ``worst > best`` for metrics
    where lower raw values are better (e.g. P/E ratios).
    Returns None when the input is missing so the metric can be skipped.
    """
    if value is None or not np.isfinite(value):
        return None
    return _clamp((value - worst) / (best - worst) * 100)


def _peak_score(value: float | None, peak: float, tolerance: float) -> float | None:
    """Score 100 at ``peak``, decaying linearly to 0 at ``peak +/- tolerance``."""
    if value is None or not np.isfinite(value):
        return None
    return _clamp(100 * (1 - abs(value - peak) / tolerance))


def _metric(metric_id: str, label: str, value: float | None,
            formatted: str | None, score: float | None, weight: float) -> dict:
    """Package one scored metric for the API response."""
    return {
        "id": metric_id,
        "label": label,
        "value": None if value is None or not np.isfinite(value) else round(float(value), 4),
        "formatted": formatted if formatted is not None else "N/A",
        "score": None if score is None else round(score, 1),
        "weight": weight,
    }


def _safe_number(raw) -> float | None:
    """Coerce a yfinance info field to float, treating junk as missing."""
    if raw is None or isinstance(raw, str):
        return None
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None
    return value if np.isfinite(value) else None


# Formatting helpers keep the API self-describing for the frontend.

def _fmt_ratio(value: float | None, suffix: str = "x") -> str | None:
    return None if value is None else f"{value:.2f}{suffix}"


def _fmt_percent(value: float | None) -> str | None:
    return None if value is None else f"{value * 100:.1f}%"


def _fmt_plain(value: float | None, decimals: int = 2) -> str | None:
    return None if value is None else f"{value:.{decimals}f}"


# ---------------------------------------------------------------------------
# Data fetching
# ---------------------------------------------------------------------------

def _download_history(tickers: list[str]) -> pd.DataFrame:
    """One year of adjusted daily closes, columns = tickers."""
    end = pd.Timestamp.now()
    start = end - pd.Timedelta(days=HISTORY_LOOKBACK_DAYS)
    data = yf.download(
        tickers,
        start=start.strftime("%Y-%m-%d"),
        end=(end + pd.Timedelta(days=1)).strftime("%Y-%m-%d"),
        auto_adjust=True,
        progress=False,
    )["Close"]

    if isinstance(data, pd.Series):
        data = data.to_frame(tickers[0])

    return data.dropna(how="all").ffill().dropna()


# ---------------------------------------------------------------------------
# Pillar 1 — Financial Health (25%)
# ---------------------------------------------------------------------------

def _score_financial(info: dict) -> list[dict]:
    """Balance sheet strength and profitability.

    Metric              Weight  Worst -> Best        Direction
    ------------------  ------  -------------------  ---------------
    Debt / Equity        25%    300% -> 30%          lower is better
    Current Ratio        15%    0.5x -> 2.0x         higher is better
    Net Profit Margin    20%    -10% -> 25%          higher is better
    Operating Margin     15%    -5%  -> 30%          higher is better
    Return on Equity     25%    0%   -> 30%          higher is better
    """
    debt_to_equity = _safe_number(info.get("debtToEquity"))       # yfinance reports percent (150 = 1.5x)
    current_ratio = _safe_number(info.get("currentRatio"))
    profit_margin = _safe_number(info.get("profitMargins"))       # fraction
    operating_margin = _safe_number(info.get("operatingMargins")) # fraction
    return_on_equity = _safe_number(info.get("returnOnEquity"))   # fraction

    return [
        _metric("debt_to_equity", "Debt / Equity", debt_to_equity,
                _fmt_percent(debt_to_equity / 100 if debt_to_equity is not None else None),
                _linear_score(debt_to_equity, worst=300, best=30), 0.25),
        _metric("current_ratio", "Current Ratio", current_ratio,
                _fmt_ratio(current_ratio),
                _linear_score(current_ratio, worst=0.5, best=2.0), 0.15),
        _metric("profit_margin", "Net Profit Margin", profit_margin,
                _fmt_percent(profit_margin),
                _linear_score(profit_margin, worst=-0.10, best=0.25), 0.20),
        _metric("operating_margin", "Operating Margin", operating_margin,
                _fmt_percent(operating_margin),
                _linear_score(operating_margin, worst=-0.05, best=0.30), 0.15),
        _metric("return_on_equity", "Return on Equity", return_on_equity,
                _fmt_percent(return_on_equity),
                _linear_score(return_on_equity, worst=0.0, best=0.30), 0.25),
    ]


# ---------------------------------------------------------------------------
# Pillar 2 — Market Performance (20%)
# ---------------------------------------------------------------------------

def _score_market(stock_prices: pd.Series, benchmark_prices: pd.Series) -> list[dict]:
    """Trailing 1-year risk/return profile versus the S&P 500 (SPY).

    Metric                 Weight  Worst -> Best      Direction
    ---------------------  ------  -----------------  -----------------
    Sharpe Ratio            35%    -0.5 -> 2.0        higher is better
    Annualized Volatility   25%    60%  -> 15%        lower is better
    Jensen's Alpha          25%    -15% -> +15%       higher is better
    Beta                    15%    peak 1.0, tol 1.5  closest to 1 wins
    """
    aligned = pd.concat([stock_prices, benchmark_prices], axis=1, join="inner").dropna()
    stock_returns = aligned.iloc[:, 0].pct_change().dropna()
    bench_returns = aligned.iloc[:, 1].pct_change().dropna()

    ann_return = float(stock_returns.mean() * TRADING_DAYS)
    ann_vol = float(stock_returns.std(ddof=1) * np.sqrt(TRADING_DAYS))
    bench_ann_return = float(bench_returns.mean() * TRADING_DAYS)

    covariance = np.cov(stock_returns, bench_returns)
    beta = float(covariance[0, 1] / covariance[1, 1]) if covariance[1, 1] else None

    sharpe = (ann_return - RISK_FREE_RATE) / ann_vol if ann_vol else None

    # Jensen's alpha: excess return beyond what beta exposure alone explains.
    alpha = None
    if beta is not None:
        expected = RISK_FREE_RATE + beta * (bench_ann_return - RISK_FREE_RATE)
        alpha = ann_return - expected

    return [
        _metric("sharpe_ratio", "Sharpe Ratio (1Y)", sharpe,
                _fmt_plain(sharpe),
                _linear_score(sharpe, worst=-0.5, best=2.0), 0.35),
        _metric("volatility", "Annualized Volatility", ann_vol,
                _fmt_percent(ann_vol),
                _linear_score(ann_vol, worst=0.60, best=0.15), 0.25),
        _metric("alpha", "Jensen's Alpha vs. SPY", alpha,
                _fmt_percent(alpha),
                _linear_score(alpha, worst=-0.15, best=0.15), 0.25),
        _metric("beta", "Beta vs. SPY", beta,
                _fmt_plain(beta),
                _peak_score(beta, peak=1.0, tolerance=1.5), 0.15),
    ]


# ---------------------------------------------------------------------------
# Pillar 3 — Valuation (20%)
# ---------------------------------------------------------------------------

def _score_valuation(info: dict) -> list[dict]:
    """How expensive the stock is relative to earnings, book value, and growth.

    All valuation metrics are "lower is better". Negative multiples mean
    negative earnings/EBITDA; yfinance usually omits them, so they simply
    fall out as missing and the pillar renormalizes.

    Metric          Weight  Worst -> Best
    --------------  ------  --------------
    Trailing P/E     25%    50x -> 10x
    Forward P/E      25%    45x -> 10x
    Price / Book     15%    10x -> 1x
    PEG Ratio        20%    3.0 -> 0.5
    EV / EBITDA      15%    25x -> 6x
    """
    trailing_pe = _safe_number(info.get("trailingPE"))
    forward_pe = _safe_number(info.get("forwardPE"))
    price_to_book = _safe_number(info.get("priceToBook"))
    peg_ratio = _safe_number(info.get("trailingPegRatio") or info.get("pegRatio"))
    ev_to_ebitda = _safe_number(info.get("enterpriseToEbitda"))

    # A negative multiple signals losses, which is the worst valuation case.
    def _floor_negative(value: float | None) -> float | None:
        if value is None:
            return None
        return value if value > 0 else None

    trailing_pe = _floor_negative(trailing_pe)
    forward_pe = _floor_negative(forward_pe)
    ev_to_ebitda = _floor_negative(ev_to_ebitda)

    return [
        _metric("trailing_pe", "Trailing P/E", trailing_pe,
                _fmt_ratio(trailing_pe),
                _linear_score(trailing_pe, worst=50, best=10), 0.25),
        _metric("forward_pe", "Forward P/E", forward_pe,
                _fmt_ratio(forward_pe),
                _linear_score(forward_pe, worst=45, best=10), 0.25),
        _metric("price_to_book", "Price / Book", price_to_book,
                _fmt_ratio(price_to_book),
                _linear_score(price_to_book, worst=10, best=1), 0.15),
        _metric("peg_ratio", "PEG Ratio", peg_ratio,
                _fmt_ratio(peg_ratio),
                _linear_score(peg_ratio, worst=3.0, best=0.5), 0.20),
        _metric("ev_to_ebitda", "EV / EBITDA", ev_to_ebitda,
                _fmt_ratio(ev_to_ebitda),
                _linear_score(ev_to_ebitda, worst=25, best=6), 0.15),
    ]


# ---------------------------------------------------------------------------
# Pillar 4 — Analyst Recommendations (15%)
# ---------------------------------------------------------------------------

def _score_anr(info: dict, current_price: float | None) -> list[dict]:
    """Street consensus, price-target upside, and coverage depth.

    Metric               Weight  Worst -> Best      Notes
    -------------------  ------  -----------------  ------------------------
    Consensus Rating      45%    5.0 -> 1.0         1 = Strong Buy, 5 = Sell
    Target Price Upside   40%    -20% -> +30%       mean target vs. price
    Analyst Coverage      15%    0 -> 20 analysts   confidence in consensus
    """
    recommendation = _safe_number(info.get("recommendationMean"))
    target_price = _safe_number(info.get("targetMeanPrice"))
    num_analysts = _safe_number(info.get("numberOfAnalystOpinions"))

    target_upside = None
    if target_price is not None and current_price:
        target_upside = (target_price - current_price) / current_price

    return [
        _metric("consensus_rating", "Consensus Rating", recommendation,
                _fmt_plain(recommendation),
                _linear_score(recommendation, worst=5.0, best=1.0), 0.45),
        _metric("target_upside", "Target Price Upside", target_upside,
                _fmt_percent(target_upside),
                _linear_score(target_upside, worst=-0.20, best=0.30), 0.40),
        _metric("analyst_coverage", "Analyst Coverage", num_analysts,
                _fmt_plain(num_analysts, decimals=0),
                _linear_score(num_analysts, worst=0, best=20), 0.15),
    ]


# ---------------------------------------------------------------------------
# Pillar 5 — Technical Indicators (10%)
# ---------------------------------------------------------------------------

def _rsi(prices: pd.Series, window: int = 14) -> float | None:
    """Wilder's RSI over ``window`` days. 0-100; ~50 is neutral."""
    delta = prices.diff().dropna()
    if len(delta) < window:
        return None

    gains = delta.clip(lower=0)
    losses = -delta.clip(upper=0)
    avg_gain = gains.ewm(alpha=1 / window, min_periods=window).mean().iloc[-1]
    avg_loss = losses.ewm(alpha=1 / window, min_periods=window).mean().iloc[-1]

    if avg_loss == 0:
        return 100.0
    relative_strength = avg_gain / avg_loss
    return float(100 - 100 / (1 + relative_strength))


def _score_technical(prices: pd.Series) -> list[dict]:
    """Trend and momentum diagnostics from one year of daily closes.

    Metric              Weight  Scoring
    ------------------  ------  -----------------------------------------
    RSI (14)             30%    peak at 50, 0 at 0/100 (extremes = risk)
    Price vs. 50-DMA     25%    -10% -> +10% linear
    Price vs. 200-DMA    25%    -15% -> +15% linear
    Bollinger %B (20d)   20%    peak at 0.5 (mid-band), 0 at the bands
    """
    last_price = float(prices.iloc[-1])

    rsi = _rsi(prices)

    sma_50 = float(prices.rolling(50).mean().iloc[-1]) if len(prices) >= 50 else None
    sma_200 = float(prices.rolling(200).mean().iloc[-1]) if len(prices) >= 200 else None
    gap_50 = (last_price - sma_50) / sma_50 if sma_50 else None
    gap_200 = (last_price - sma_200) / sma_200 if sma_200 else None

    percent_b = None
    if len(prices) >= 20:
        sma_20 = float(prices.rolling(20).mean().iloc[-1])
        std_20 = float(prices.rolling(20).std(ddof=1).iloc[-1])
        if std_20 > 0:
            lower_band = sma_20 - 2 * std_20
            percent_b = (last_price - lower_band) / (4 * std_20)

    return [
        _metric("rsi_14", "RSI (14-day)", rsi,
                _fmt_plain(rsi, decimals=1),
                _peak_score(rsi, peak=50, tolerance=50), 0.30),
        _metric("price_vs_sma50", "Price vs. 50-Day MA", gap_50,
                _fmt_percent(gap_50),
                _linear_score(gap_50, worst=-0.10, best=0.10), 0.25),
        _metric("price_vs_sma200", "Price vs. 200-Day MA", gap_200,
                _fmt_percent(gap_200),
                _linear_score(gap_200, worst=-0.15, best=0.15), 0.25),
        _metric("bollinger_percent_b", "Bollinger %B (20-day)", percent_b,
                _fmt_plain(percent_b),
                _peak_score(percent_b, peak=0.5, tolerance=0.5), 0.20),
    ]


# ---------------------------------------------------------------------------
# Pillar 6 — Earnings Quality (10%)
# ---------------------------------------------------------------------------

def _score_earnings(ticker_obj: yf.Ticker, info: dict) -> list[dict]:
    """EPS surprise history and forward growth.

    Metric                Weight  Worst -> Best   Notes
    --------------------  ------  --------------  -----------------------------
    Avg. EPS Surprise      40%    -10% -> +10%    last <=8 reported quarters
    Beat Consistency       35%    0% -> 100%      share of quarters beating est.
    Earnings Growth (YoY)  25%    -30% -> +30%    from yfinance earningsGrowth
    """
    avg_surprise = None
    beat_rate = None

    try:
        history = ticker_obj.earnings_history
    except Exception:
        history = None

    if history is not None and not history.empty:
        reported = history.dropna(subset=["epsActual", "epsEstimate"]).tail(8)
        estimates = reported["epsEstimate"]
        actuals = reported["epsActual"]
        valid = estimates.abs() > 1e-9
        if valid.any():
            surprises = (actuals[valid] - estimates[valid]) / estimates[valid].abs()
            avg_surprise = float(surprises.mean())
            beat_rate = float((surprises >= 0).mean())

    earnings_growth = _safe_number(info.get("earningsGrowth"))

    return [
        _metric("avg_eps_surprise", "Avg. EPS Surprise", avg_surprise,
                _fmt_percent(avg_surprise),
                _linear_score(avg_surprise, worst=-0.10, best=0.10), 0.40),
        _metric("beat_consistency", "Beat Consistency", beat_rate,
                _fmt_percent(beat_rate),
                _linear_score(beat_rate, worst=0.0, best=1.0), 0.35),
        _metric("earnings_growth", "Earnings Growth (YoY)", earnings_growth,
                _fmt_percent(earnings_growth),
                _linear_score(earnings_growth, worst=-0.30, best=0.30), 0.25),
    ]


# ---------------------------------------------------------------------------
# Aggregation
# ---------------------------------------------------------------------------

def _aggregate(metrics: list[dict]) -> float | None:
    """Weight-average available metric scores; None if nothing scored."""
    scored = [m for m in metrics if m["score"] is not None]
    if not scored:
        return None
    total_weight = sum(m["weight"] for m in scored)
    return sum(m["score"] * m["weight"] for m in scored) / total_weight


def _rating_for(score: float) -> str:
    for threshold, label in RATING_BANDS:
        if score >= threshold:
            return label
    return RATING_BANDS[-1][1]


def run_atlas_score(ticker: str) -> dict:
    """Compute the full Atlas Score payload for one ticker.

    Raises ValueError when the ticker has no price data (unknown symbol).
    """
    ticker_obj = yf.Ticker(ticker)

    try:
        info = ticker_obj.get_info() or {}
    except Exception:
        info = {}

    prices = _download_history([ticker, BENCHMARK_TICKER])
    if ticker not in prices.columns or prices[ticker].dropna().empty:
        raise ValueError(f"No price data found for {ticker}")

    stock_prices = prices[ticker].dropna()
    benchmark_prices = prices[BENCHMARK_TICKER].dropna()
    current_price = float(stock_prices.iloc[-1])

    pillar_metrics = {
        "financial": _score_financial(info),
        "market": _score_market(stock_prices, benchmark_prices),
        "valuation": _score_valuation(info),
        "anr": _score_anr(info, current_price),
        "technical": _score_technical(stock_prices),
        "earnings": _score_earnings(ticker_obj, info),
    }

    pillars = []
    for pillar_id, weight in PILLAR_WEIGHTS.items():
        metrics = pillar_metrics[pillar_id]
        pillar_score = _aggregate(metrics)
        pillars.append(
            {
                "id": pillar_id,
                "label": PILLAR_LABELS[pillar_id],
                "weight": weight,
                "score": None if pillar_score is None else round(pillar_score),
                "metrics": metrics,
            }
        )

    scored_pillars = [p for p in pillars if p["score"] is not None]
    if not scored_pillars:
        raise ValueError(f"Insufficient data to score {ticker}")

    total_weight = sum(p["weight"] for p in scored_pillars)
    composite = sum(p["score"] * p["weight"] for p in scored_pillars) / total_weight

    total_metrics = sum(len(p["metrics"]) for p in pillars)
    scored_metrics = sum(
        1 for p in pillars for m in p["metrics"] if m["score"] is not None
    )

    return {
        "ticker": ticker.upper(),
        "company_name": info.get("shortName") or info.get("longName") or ticker.upper(),
        "as_of": datetime.now().strftime("%Y-%m-%d"),
        "current_price": round(current_price, 2),
        "composite_score": round(composite),
        "rating": _rating_for(composite),
        "pillars": pillars,
        "coverage": {
            "metrics_scored": scored_metrics,
            "metrics_total": total_metrics,
        },
        "benchmark": BENCHMARK_TICKER,
    }
