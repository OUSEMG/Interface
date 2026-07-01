# OUSEMG Portfolio Tracker — Implementation Spec

## Overview

Build a portfolio performance tracker that reads a static Excel holdings ledger, fetches live prices from yfinance on demand, and displays portfolio performance in a React frontend. There is no scheduler — the user triggers a manual refresh. No database is required at this stage; all state is computed in memory per request.

This module lives inside the existing OUSEMG Member Interface. It follows the established stack: **Python + FastAPI backend, React 19 (plain JS, no TypeScript) + Vite frontend.**

---

## Input File

**File:** `OUSEMG_Holdings_Ledger.xlsx`  
Place this file in `backend/data/OUSEMG_Holdings_Ledger.xlsx`. The backend reads it at request time — do not cache it at startup, so updates to the file take effect without restarting the server.

### Sheet Structure

The workbook has three sheets: `Traditional`, `Sustainable`, `README`.

Both data sheets share identical column structure:

| Col | Field | Notes |
|-----|-------|-------|
| A | Security (full name) | String |
| B | Ticker | String — primary yfinance symbol |
| C | # Shares | Integer |
| D | Snapshot Price (06/19) | Float — price per share at 06/19/2026 |
| E | Snapshot Value (06/19) | Float — total position value at 06/19/2026 |
| F | Asset Class | String |
| G | Notes | String, may be empty |
| H | yfinance Ticker Override | String — if non-empty, use this ticker for yfinance instead of col B |
| I | Include in Portfolio | String — only include rows where value == "YES" |
| J | Snapshot Date | String |

**Data starts at row 4.** Rows 1–3 are title, subtitle, and header. Stop reading when column B is empty or equals "CASH". Handle the CASH row separately (see below).

### CASH Row

Each sheet has one CASH row (column B = "CASH"). Treat it as:
- Current cash balance = column E value (Snapshot Value)
- Cash does not get a live price fetch — it is always valued at the snapshot figure
- Include cash in total AUM and weight calculations

### Reading the File

Use `openpyxl` with `data_only=True` to read calculated cell values:

```python
from openpyxl import load_workbook

def read_holdings(sheet_name: str) -> list[dict]:
    wb = load_workbook("backend/data/OUSEMG_Holdings_Ledger.xlsx", data_only=True)
    ws = wb[sheet_name]
    holdings = []
    for row in ws.iter_rows(min_row=4, values_only=True):
        ticker = row[1]  # column B
        if not ticker:
            break
        if row[8] != "YES":  # column I
            continue
        yf_ticker = row[7] if row[7] else ticker  # column H override
        holdings.append({
            "name": row[0],
            "ticker": ticker,
            "yf_ticker": yf_ticker,
            "shares": row[2],
            "snapshot_price": row[3],
            "snapshot_value": row[4],
            "asset_class": row[5],
            "is_cash": ticker == "CASH",
        })
    return holdings
```

---

## Backend

### File Structure

```
backend/
  routers/
    portfolio.py       ← new router
  services/
    portfolio_service.py  ← business logic
  data/
    OUSEMG_Holdings_Ledger.xlsx
```

Register the router in `main.py`:
```python
from routers import portfolio
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
```

### Dependencies

```
yfinance
openpyxl
pandas  # already in stack
```

### In-Memory Cache

Add a simple module-level cache so rapid successive requests do not hammer yfinance. Cache expires after 5 minutes.

```python
import time

_cache = {}
CACHE_TTL = 300  # seconds

def get_cached(key):
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < CACHE_TTL:
        return entry["data"]
    return None

def set_cached(key, data):
    _cache[key] = {"data": data, "ts": time.time()}
```

### Price Fetching

Fetch all tickers for a given portfolio in a single yfinance call to minimize latency:

```python
import yfinance as yf

def fetch_prices(yf_tickers: list[str]) -> dict[str, float]:
    """Returns {yf_ticker: current_price}. Excludes CASH."""
    equity_tickers = [t for t in yf_tickers if t != "CASH"]
    if not equity_tickers:
        return {}
    raw = yf.download(
        equity_tickers,
        period="2d",
        auto_adjust=True,
        progress=False
    )
    prices = {}
    close = raw["Close"]
    for ticker in equity_tickers:
        try:
            col = close[ticker] if len(equity_tickers) > 1 else close
            price = float(col.dropna().iloc[-1])
            prices[ticker] = price
        except Exception:
            prices[ticker] = None
    return prices
```

**Error handling:** If yfinance returns `None` for a ticker, return that position's snapshot value as its current value and flag it with `"price_stale": true` in the response. Do not crash the entire fetch.

### Calculations

For each position (excluding cash):

```
current_value   = current_price × shares
snapshot_value  = snapshot_price × shares  (from ledger)
gain_loss       = current_value − snapshot_value
return_since_snapshot = (current_value − snapshot_value) / snapshot_value
weight          = current_value / total_portfolio_value
```

For YTD return, fetch the price on the first trading day of the current calendar year using:
```python
ytd_data = yf.download(ticker, start="2026-01-01", end="2026-01-10", auto_adjust=True, progress=False)
ytd_price = float(ytd_data["Close"].dropna().iloc[0])
ytd_return = (current_price - ytd_price) / ytd_price
```

Fetch YTD prices in the same batch call where possible to avoid extra round trips.

For the S&P 500 benchmark, use ticker `SPY`. Calculate its return-since-snapshot and YTD return using the same method.

Portfolio-level aggregates:
```
total_aum             = sum of all current_values (equities + cash)
portfolio_return_since_snapshot = (total_aum − sum_of_all_snapshot_values) / sum_of_all_snapshot_values
```

### API Endpoints

#### `GET /api/portfolio/{portfolio_name}/snapshot`

`portfolio_name` is either `traditional` or `sustainable`.

**Query params:**
- `force_refresh=true` — bypass cache and re-fetch from yfinance

**Response schema:**

```json
{
  "portfolio": "traditional",
  "fetched_at": "2026-06-26T14:32:00Z",
  "cache_hit": false,
  "snapshot_date": "06/19/2026",
  "benchmark_ticker": "SPY",
  "summary": {
    "total_aum": 6412000.00,
    "snapshot_aum": 6165218.00,
    "total_gain_loss": 246782.00,
    "return_since_snapshot": 0.0400,
    "ytd_return": 0.1047,
    "benchmark_return_since_snapshot": 0.0310,
    "benchmark_ytd_return": 0.0972,
    "excess_return_since_snapshot": 0.0090,
    "excess_ytd_return": 0.0075
  },
  "holdings": [
    {
      "name": "NVIDIA Corporation",
      "ticker": "NVDA",
      "yf_ticker": "NVDA",
      "shares": 1823,
      "asset_class": "Technology",
      "snapshot_price": 210.69,
      "snapshot_value": 384087.87,
      "current_price": 219.50,
      "current_value": 400038.50,
      "gain_loss": 15950.63,
      "return_since_snapshot": 0.0415,
      "ytd_return": 0.1311,
      "weight": 0.0624,
      "price_stale": false
    }
  ]
}
```

#### `GET /api/portfolio/combined/snapshot`

Returns both portfolios and the combined ABX-level summary. Calls both portfolio fetches (uses cache if warm) and aggregates.

**Additional fields in combined response:**
```json
{
  "combined_aum": 13014139.47,
  "traditional": { ...same structure as above... },
  "sustainable": { ...same structure as above... }
}
```

#### `GET /api/portfolio/{portfolio_name}/top-movers`

Returns top 5 and bottom 5 positions by `return_since_snapshot`. Derives from the snapshot data — no additional fetch needed if cache is warm.

**Response:**
```json
{
  "top": [...5 holdings sorted desc by return_since_snapshot...],
  "bottom": [...5 holdings sorted asc by return_since_snapshot...]
}
```

---

## Frontend

### Route

Mount at `/portfolio`. Add to the sidebar nav under a "Portfolio" section.

### Page Layout

The page has two sections: a **Summary Bar** at the top and a **Holdings Table** below. No sidebar within the page. Keep it clean.

#### Summary Bar

Four metric cards in a horizontal row:

| Card | Value | Sub-label |
|------|-------|-----------|
| Total AUM | `$13,014,139` | Combined |
| Return Since 6/19 | `+4.00%` | vs SPY: +3.10% |
| YTD Return | `+10.47%` | vs SPY: +9.72% |
| Last Refreshed | `2:32 PM` | Cache or live indicator |

Color the return values: green if positive, red if negative. Use subtle color — not garish. The OUSEMG green accent is `#1d6b35`.

Include a **"Refresh Prices"** button in the top-right of the summary bar. On click it calls the API with `force_refresh=true` and shows a loading spinner. Disable the button while the fetch is in progress.

Include a **portfolio selector**: `Traditional | Sustainable | Combined`. Defaults to Combined. Switching updates both the summary bar and the table.

#### Holdings Table

Columns:
- Security (left-aligned, full name)
- Ticker (bold, monospace)
- Shares
- Current Price
- Current Value
- Snapshot Value (06/19)
- Gain / Loss ($)
- Return Since 6/19 (%)
- YTD Return (%)
- Weight (%)
- Asset Class

Sortable by any numeric column (click header to sort, click again to reverse). Default sort: Weight descending.

Color-code the "Return Since 6/19" and "YTD Return" cells only — green if positive, red if negative. No color on other cells.

Format numbers:
- Prices: `$219.50`
- Values / Gain-Loss: `$400,038` (no cents for large numbers)
- Percentages: `+4.15%` with explicit sign
- Weight: `6.24%`

For positions with `price_stale: true`, show a small `⚠` icon next to the current price and a tooltip: "Price unavailable — showing snapshot value."

#### Loading State

Show a skeleton loader (gray pulsing rectangles) while the API call is in progress. Do not show a blank page or spinner only.

#### Error State

If the API returns an error, show an inline error banner: "Could not fetch prices. Showing last known data." with a retry button. Do not crash the page.

---

## Swap Points

Two clearly marked swap points for future upgrades:

**1. Data Source — yfinance → BLPAPI**

In `portfolio_service.py`, isolate all yfinance calls inside a single function `fetch_prices()`. Add a comment:

```python
# SWAP POINT: Replace this function with BLPAPI equivalent when terminal bridge is ready.
# BLPAPI call should return the same dict shape: {yf_ticker: float}
```

**2. Cash Balance — Static → Live**

The cash balance is currently hardcoded in the Excel ledger. When the PM uploads weekly Excel reports, the cash row should update automatically. Add a comment in `read_holdings()`:

```python
# SWAP POINT: When weekly Excel ingestion is implemented, cash balance
# should be read from the most recent uploaded snapshot rather than the static ledger.
```

---

## What This Feature Does Not Do

Be explicit with the agent — do not implement these:

- Real-time streaming or websocket price updates
- Scheduled background polling
- Per-position historical charts (belongs in Atlas)
- Attribution analysis (belongs in Atlas / Bloomberg PORT)
- Dividend tracking
- Cost basis from fund inception (only snapshot-date basis is available)
- User authentication gating on this route (handled at the app level)

---

## Testing Checklist

Before marking this feature complete, verify:

- [ ] Both Traditional and Sustainable sheets parse without error
- [ ] CASH row is included in AUM but not sent to yfinance
- [ ] Barrick (`B`) uses `GOLD` as the yfinance ticker (override column)
- [ ] Cache returns stale data within 5-minute window, refreshes after
- [ ] `force_refresh=true` bypasses cache correctly
- [ ] Stale price flag renders the warning icon in the table
- [ ] Portfolio selector switches table data without page reload
- [ ] Refresh button disables during fetch and re-enables on completion
- [ ] Table sorts correctly on all numeric columns
- [ ] Combined view aggregates both portfolios correctly
- [ ] No crash if yfinance returns None for one or more tickers