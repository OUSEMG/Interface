# Atlas — Portfolio Research Page Agent Prompt

## Objective

Build the **Portfolio Research** page for Atlas. This is a quant analytics dashboard — not a general portfolio view. Holdings, weights, P&L, and sector breakdowns live on a separate page. This page is exclusively the quantitative lens on portfolio performance and risk.

---

## Design Language

Inherit directly from the Atlas landing page aesthetic:

| Token | Value |
|---|---|
| Primary accent | `#1d6b35` |
| Background | Deep navy / near-black |
| Feel | High-tech, data-dense, terminal-inspired |
| Fonts | `JetBrains Mono` or `Space Mono` (monospace) + `Syne` or `Outfit` (display) — load from Google Fonts |

Charts should feel like Bloomberg panels. Stat cards should be tight and data-dense. Nothing decorative.

---

## Page Structure

### 1. Control Bar

A single sticky bar at the top of the page. Contains:

- **Portfolio label** — displays the portfolio name on the left (static text for now)
- **Date range selector** — a set of period toggle buttons: `3M` `6M` `YTD` `1Y` `All`
- **Run Analysis button** — right-aligned, primary accent color. Nothing on the page loads until this is clicked. User intent is required.

No data populates on page load. The page starts in an empty/waiting state with a subtle placeholder message, e.g. `"Select a period and run analysis."` in monospace.

---

### 2. Band 1 — Metric Summary Row

A horizontal row of stat cards directly below the control bar. Each card contains:

- A metric label (small, monospace, subdued)
- A large primary value (display font, prominent)
- A secondary label where relevant (e.g. "annualized", "vs. S&P 500")

**Cards to display:**

| Metric | Description |
|---|---|
| Sharpe Ratio | Risk-adjusted return using total volatility |
| Sortino Ratio | Risk-adjusted return penalizing downside volatility only |
| Max Drawdown | Largest peak-to-trough decline over the period |
| Annualized Volatility | Annualized standard deviation of daily returns |
| Beta | Portfolio sensitivity to the S&P 500 |

Cards sit in a single scrollable row. On tablet, they can wrap to two rows.

---

### 3. Band 2 — Time Series Charts (Two Columns)

Two equal-width chart panels side by side.

**Left: Drawdown Curve**
- Time series chart showing portfolio drawdown from peak over the selected period
- The area below the zero line fills in a muted red
- The zero line is clearly marked
- X-axis: dates. Y-axis: drawdown percentage.

**Right: Rolling Volatility**
- Line chart showing 30-day rolling annualized volatility over the selected period
- Single line, accent color
- X-axis: dates. Y-axis: volatility percentage.
- Label the rolling window clearly (e.g. `"30-Day Rolling Ann. Volatility"`)

Both charts share the same x-axis date range, driven by the period selector.

---

### 4. Band 3 — Distribution and Correlation (Two Columns)

Two equal-width panels side by side.

**Left: Return Distribution Histogram**
- Bar chart showing frequency of daily returns binned into ranges
- Bars centered around zero, negative bins in muted red, positive bins in accent green
- Below the chart, display two stat lines in monospace:
  - `Skewness: -0.34`
  - `Kurtosis: 4.21`

**Right: Correlation Matrix**
- Heatmap grid of all portfolio holdings
- Ticker labels on both axes
- Each cell color-coded: low correlation toward green, high correlation toward red
- Correlation coefficient displayed inside each cell in small monospace text
- Diagonal (self-correlation) cells are a neutral color, not green

---

## Interaction Notes

- **Nothing loads on page open.** Empty state with a waiting message.
- **Run Analysis triggers all four bands simultaneously.** Show a loading state per panel if needed.
- **Date range selector updates are not applied until Run Analysis is clicked again.** Don't auto-refresh on period change.
- `COMING SOON` cards or panels are not needed here — all panels either load or show an error state.
- Clicking a stat card does nothing for now. No drill-down yet.

---

## Data Notes (For Implementation)

All metrics are computed from daily return data. Use `yfinance` as the data source during development. Mark the data-fetch layer with a clearly commented swap point for Bloomberg BLPAPI in production.

| Metric | Computation |
|---|---|
| Sharpe Ratio | `(Ann. Return - Risk Free Rate) / Ann. Volatility` — use 4.35% as risk-free rate |
| Sortino Ratio | `(Ann. Return - Risk Free Rate) / Downside Deviation` |
| Max Drawdown | `min((Portfolio Value - Rolling Max) / Rolling Max)` |
| Ann. Volatility | `Daily Return Std Dev × sqrt(252)` |
| Beta | `Cov(Portfolio, S&P 500) / Var(S&P 500)` |
| Rolling Volatility | 30-day rolling window of annualized daily return std dev |
| Skewness / Kurtosis | Standard scipy stats functions on daily return series |
| Correlation Matrix | Pearson correlation of daily returns across all holdings |

---

## Technical Constraints

- React with plain JavaScript only — no TypeScript
- All styling in a single CSS file
- No external component libraries
- Charts: use a lightweight library — `recharts` is acceptable
- No placeholder images — all visual elements must be CSS, SVG, or chart-rendered
- Responsive down to tablet width

---

## Deliverables

```
src/
  PortfolioResearchPage.js
  PortfolioResearchPage.css
```

No boilerplate comments. Production-quality code only.