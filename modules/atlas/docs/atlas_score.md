# Atlas Score — Methodology & Implementation Reference

The Atlas Score is a 0–100 composite quality score for a single equity. It condenses
six pillars — financial health, market performance, valuation, analyst sentiment,
technicals, and earnings quality — into one number with a full metric-level breakdown.

- **Implementation:** `modules/atlas/backend/atlas_score.py` (`run_atlas_score(ticker)`)
- **Endpoint:** `GET /api/atlas-score/{ticker}` (JWT-protected, registered in `main.py`)
- **Frontend:** `frontend/src/modules/atlas/components/AtlasScoreTool.jsx`, launched from
  the Quant Tooling grid (`/atlas/tooling`)
- **Data source:** yfinance — `Ticker.get_info()` for fundamentals,
  `yf.download` for one year of adjusted daily closes (stock + SPY benchmark),
  `Ticker.earnings_history` for EPS surprises.
  `# SWAP POINT:` replace with Bloomberg BLPAPI in production.

This document is the source of truth for every weight and bound. If you change a
number in `atlas_score.py`, change it here too.

---

## 1. Scoring pipeline

Three stages, all pure weighted averages:

```
raw metric ──normalize──► metric sub-score (0–100)
metric sub-scores ──weight-average──► pillar score (0–100)
pillar scores ──weight-average──► composite Atlas Score (0–100)
```

### 1.1 Normalizers

Every raw metric is mapped to 0–100 with one of two functions. Fixed absolute bounds
were chosen over cross-sectional z-scores so a single-ticker request needs no peer
universe, results are reproducible, and each bound is auditable below.

**Linear scale — `_linear_score(value, worst, best)`**

```
score = clamp( (value − worst) / (best − worst) × 100 , 0, 100 )
```

- Scores 0 at `worst`, 100 at `best`, linear in between, clamped outside.
- Passing `worst > best` inverts direction, used for "lower is better" metrics
  (e.g. P/E: `worst=50, best=10`).

**Peak scale — `_peak_score(value, peak, tolerance)`**

```
score = clamp( 100 × (1 − |value − peak| / tolerance) , 0, 100 )
```

- Scores 100 exactly at `peak` and decays linearly to 0 at `peak ± tolerance`.
- Used for "sweet spot" metrics where both extremes are bad: RSI (overbought and
  oversold are both risk), beta (both ultra-defensive and ultra-aggressive penalized),
  Bollinger %B (band-riding in either direction).

### 1.2 Missing-data policy

- A metric with no data (yfinance returns nothing, or the value is non-numeric /
  non-finite) gets `score: null` and is **dropped from its pillar**; the remaining
  metric weights are renormalized to sum to 1.
- A pillar where *every* metric is missing gets `score: null` and is dropped from the
  composite; remaining pillar weights are renormalized.
- Negative valuation multiples (negative earnings/EBITDA) are treated as missing rather
  than scored, since a −40x P/E is not "cheap".
- The response reports `coverage.metrics_scored / coverage.metrics_total` so the
  frontend can flag low-confidence scores.
- If **no** pillar can be scored, or the ticker has no price history, the endpoint
  returns HTTP 400.

---

## 2. Pillar weights

| Pillar | ID | Weight | Rationale |
|---|---|---|---|
| Financial Health | `financial` | **25%** | Balance-sheet quality is the slowest-moving, most durable signal. |
| Market Performance | `market` | **20%** | Realized risk-adjusted returns validate the thesis. |
| Valuation | `valuation` | **20%** | Price paid drives forward returns. |
| Analyst Recommendations | `anr` | **15%** | Street consensus is informative but crowded. |
| Technical Indicators | `technical` | **10%** | Entry-timing overlay, not a quality signal. |
| Earnings Quality | `earnings` | **10%** | Execution track record; smaller sample, noisier. |

Weights sum to 1.00. Composite = Σ (pillar score × pillar weight), renormalized over
available pillars. The composite and pillar scores are rounded to integers; metric
sub-scores keep one decimal.

---

## 3. Pillar definitions, metric by metric

### 3.1 Financial Health — 25% (`_score_financial`)

Balance-sheet strength and profitability from `Ticker.get_info()`.

| Metric | yfinance field | Weight | Normalizer | Worst → Best | Why these bounds |
|---|---|---|---|---|---|
| Debt / Equity | `debtToEquity` (percent, 150 = 1.5x) | 25% | linear | 300% → 30% | ≤0.3x leverage is fortress; ≥3x is distressed territory for most sectors. |
| Current Ratio | `currentRatio` | 15% | linear | 0.5x → 2.0x | <0.5x signals liquidity stress; ~2x covers short-term obligations comfortably. |
| Net Profit Margin | `profitMargins` | 20% | linear | −10% → +25% | Unprofitable scores low; 25%+ net margin is elite across sectors. |
| Operating Margin | `operatingMargins` | 15% | linear | −5% → +30% | Core-business profitability before financing effects. |
| Return on Equity | `returnOnEquity` | 25% | linear | 0% → 30% | 30%+ ROE is top-decile capital efficiency. |

### 3.2 Market Performance — 20% (`_score_market`)

Computed from one year of adjusted daily closes for the stock and SPY
(inner-joined on dates). Constants: `RISK_FREE_RATE = 4.35%`, `TRADING_DAYS = 252`.

| Metric | Computation | Weight | Normalizer | Worst → Best | Why these bounds |
|---|---|---|---|---|---|
| Sharpe Ratio (1Y) | (ann. return − rf) / ann. vol | 35% | linear | −0.5 → 2.0 | 2.0 Sharpe over a year is exceptional; below −0.5 you're losing money with volatility. |
| Annualized Volatility | daily std × √252 | 25% | linear | 60% → 15% | 15% vol is index-like calm; 60% is speculative. Lower is better. |
| Jensen's Alpha vs. SPY | ann. return − [rf + β(bench − rf)] | 25% | linear | −15% → +15% | ±15% of beta-adjusted out/under-performance covers most large caps. |
| Beta vs. SPY | cov(stock, bench) / var(bench) | 15% | peak | peak 1.0, tol 1.5 | Market-like beta scores best; 0 at β = −0.5 or 2.5. Extremes in either direction penalized. |

### 3.3 Valuation — 20% (`_score_valuation`)

All "lower is better" (bounds passed as `worst > best`). Negative multiples are
treated as missing (see §1.2).

| Metric | yfinance field | Weight | Normalizer | Worst → Best | Why these bounds |
|---|---|---|---|---|---|
| Trailing P/E | `trailingPE` | 25% | linear | 50x → 10x | 10x is deep value; above 50x you're paying for a story. |
| Forward P/E | `forwardPE` | 25% | linear | 45x → 10x | Slightly tighter ceiling — forward estimates already bake in growth. |
| Price / Book | `priceToBook` | 15% | linear | 10x → 1x | ≤1x trades below book; ≥10x book is meaningless as an anchor. |
| PEG Ratio | `trailingPegRatio` (fallback `pegRatio`) | 20% | linear | 3.0 → 0.5 | Classic Lynch framing: PEG < 1 cheap for its growth, > 3 expensive. |
| EV / EBITDA | `enterpriseToEbitda` | 15% | linear | 25x → 6x | Capital-structure-neutral multiple; 6x is cheap, 25x rich. |

### 3.4 Analyst Recommendations (ANR) — 15% (`_score_anr`)

| Metric | Source | Weight | Normalizer | Worst → Best | Why these bounds |
|---|---|---|---|---|---|
| Consensus Rating | `recommendationMean` | 45% | linear | 5.0 → 1.0 | Standard scale: 1 = Strong Buy, 3 = Hold, 5 = Sell. |
| Target Price Upside | (`targetMeanPrice` − price) / price | 40% | linear | −20% → +30% | Mean street target vs. the live price; +30% implied upside maxes out. |
| Analyst Coverage | `numberOfAnalystOpinions` | 15% | linear | 0 → 20 | Consensus from 20+ analysts is far more reliable than from 2. |

### 3.5 Technical Indicators — 10% (`_score_technical`)

Computed from the same one-year price series.

| Metric | Computation | Weight | Normalizer | Bounds | Why |
|---|---|---|---|---|---|
| RSI (14-day) | Wilder's smoothing (EWM α = 1/14) | 30% | peak | peak 50, tol 50 | 50 is neutral; 0 score only at the absolute extremes (0/100). Overbought and oversold both flag risk. |
| Price vs. 50-Day MA | (price − SMA50) / SMA50 | 25% | linear | −10% → +10% | Trading above the medium-term trend is constructive; the ±10% band saturates. |
| Price vs. 200-Day MA | (price − SMA200) / SMA200 | 25% | linear | −15% → +15% | Long-term trend filter with a wider band. Needs ≥200 trading days of history. |
| Bollinger %B (20-day) | (price − lower band) / (4σ) | 20% | peak | peak 0.5, tol 0.5 | 0.5 = mid-band equilibrium; riding either band (0 or 1) scores 0. |

### 3.6 Earnings Quality — 10% (`_score_earnings`)

EPS surprises come from `Ticker.earnings_history` (last ≤8 reported quarters with
both actual and estimate present; quarters with near-zero estimates excluded).

| Metric | Computation | Weight | Normalizer | Worst → Best | Why |
|---|---|---|---|---|---|
| Avg. EPS Surprise | mean of (actual − est) / \|est\| | 40% | linear | −10% → +10% | Consistent ±10% surprises are large for mature names. |
| Beat Consistency | share of quarters with surprise ≥ 0 | 35% | linear | 0% → 100% | Beating every quarter = 100. Measures execution reliability. |
| Earnings Growth (YoY) | `earningsGrowth` from info | 25% | linear | −30% → +30% | ±30% YoY covers most non-turnaround situations. |

---

## 4. Rating bands

| Composite | Rating |
|---|---|
| 85–100 | Exceptional |
| 70–84 | Strong |
| 55–69 | Balanced |
| 40–54 | Caution |
| 0–39 | Weak |

The frontend also colors scores in three bands: ≥70 green, 40–69 gold, <40 red
(applied per pillar and to the composite ring).

---

## 5. API contract

`GET /api/atlas-score/{ticker}` → 200:

```json
{
  "ticker": "RTX",
  "company_name": "RTX Corporation",
  "as_of": "2026-07-10",
  "current_price": 195.93,
  "composite_score": 66,
  "rating": "Balanced",
  "benchmark": "SPY",
  "coverage": { "metrics_scored": 24, "metrics_total": 24 },
  "pillars": [
    {
      "id": "financial",
      "label": "Financial",
      "weight": 0.25,
      "score": 55,
      "metrics": [
        {
          "id": "debt_to_equity",
          "label": "Debt / Equity",
          "value": 57.229,
          "formatted": "57.2%",
          "score": 89.9,
          "weight": 0.25
        }
      ]
    }
  ]
}
```

- `value` — raw metric value (units vary; `formatted` is display-ready).
- `score` / `formatted` are `null` / `"N/A"` when data is missing.
- Errors: 400 for blank/unknown tickers or unscorable names, 500 for upstream failures.

---

## 6. Frontend behavior

- Lives as a tool card on Quant Tooling (`/atlas/tooling`); selecting it renders
  `AtlasScoreTool` in-page (same pattern as Monte Carlo — no dedicated route).
- Input: single ticker + "Compute Score" button.
- Output: score-card panel (ring gauge with composite, six pillar bars) plus an
  expandable per-pillar metric table showing raw value, sub-score, and weight,
  and a plain-English methodology explainer.
- **Download:** the score card can be exported as a PNG. The card is re-rendered
  offscreen onto a `<canvas>` at 2x scale (no external screenshot library) and saved
  as `Atlas-Score-{TICKER}-{YYYY-MM-DD}.png`, matching the shareable card format
  (ticker, date, ring gauge, six pillar tiles with bars).

---

## 7. Known limitations

- yfinance `info` fields can be stale or missing for ADRs, recent IPOs, and small
  caps; the coverage counter surfaces this but cannot fix it.
- Fixed bounds are sector-agnostic: banks (structurally high D/E) and utilities
  (low growth) skew low on some metrics. A sector-relative version would need a
  peer universe.
- Newly listed names lack a 200-day MA and 8 quarters of surprises; those metrics
  drop out and the remaining ones carry more weight.
- All thresholds encode judgment, not fitted parameters. Recalibrate deliberately
  and update this file with the reasoning.
