# Atlas — Monte Carlo Simulation Tool Frontend Spec

## Objective

Build the frontend interface for the **Monte Carlo Simulation** tool inside Atlas's Quant Tooling page. This component accepts user inputs, calls the Monte Carlo FastAPI endpoint, and renders the results as a data-dense analytics panel. React with plain JavaScript. No TypeScript. No component libraries.

---

## Design Language

Inherit directly from the Atlas design system:

| Token | Value |
|---|---|
| Primary accent | `#1d6b35` |
| Background | Deep navy / near-black |
| Feel | High-tech, data-dense, terminal-inspired |
| Fonts | `JetBrains Mono` or `Space Mono` (monospace) + `Syne` or `Outfit` (display) — load from Google Fonts |

Results should feel like a Bloomberg analytics panel. Dense, structured, no decorative elements. Numbers are the UI.

---

## Page Structure

The page is a single-column layout with three vertical sections: an input bar, a summary row, and a results panel. Nothing renders in the results area until the simulation is run.

---

### 1. Input Bar

A horizontal control bar at the top of the tool. Contains all user inputs and the run button.

**Inputs:**

| Field | Type | Default | Notes |
|---|---|---|---|
| Ticker | Text input | `AAPL` | Uppercase on input, validated as non-empty before submit |
| Simulations | Number input | `10000` | Min 1,000 — max 100,000 |
| Trading Days | Number input | `252` | Min 21 (1 month) — max 504 (2 years) |
| Lookback Period | Dropdown | `365 days` | Options: `180 days`, `365 days`, `730 days` |

**Run Button:**
- Label: `RUN SIMULATION`
- Primary accent color `#1d6b35`
- Monospace font, uppercase
- Disabled and shows `RUNNING...` while the API call is in flight
- Validates inputs before firing — shows an inline error if ticker is empty or values are out of range

**Layout:** All inputs and the button sit in a single horizontal row. On tablet they stack vertically.

---

### 2. Empty State

Before the simulation is run, the results area displays a centered waiting message:

```
> awaiting simulation parameters
```

Monospace font, subdued color. No placeholder charts or skeleton loaders.

---

### 3. Summary Stat Row

Renders immediately below the input bar after results return. A horizontal row of stat cards — same pattern as the Portfolio Research page.

**Cards to display:**

| Label | Value | Notes |
|---|---|---|
| Current Price | `$365.49` | From `results.current_price` |
| Expected Price | `$476.66` | From `results.expected_price` |
| Expected Return | `+28.62%` | From `results.expected_return`, green if positive, red if negative |
| Upside Probability | `65.5%` | From `results.upside_probability` |
| Downside Probability | `34.5%` | From `results.downside_probability` |

Each card: small monospace label on top, large display font value below. Tight and dense.

---

### 4. Results Panel

Two columns side by side beneath the summary row.

---

#### Left Column — Simulation Path Chart

A line chart rendering a subset of the simulation paths over the trading day horizon.

**Rendering rules:**
- Do not render all paths — render a maximum of **200 paths** for performance, sampled randomly from `results.simulation_paths`
- Each path is a thin line at ~10% opacity, color `#1d6b35`
- A single bold line showing the **median path** (50th percentile at each day) rendered on top in white or light grey
- A horizontal dashed line at the current price for reference
- X-axis: trading days (0 to num_days)
- Y-axis: price in USD
- Chart title: `"{TICKER} — Simulated Price Paths"`

**Chart library:** Use `recharts` `LineChart`. Pre-process the path data into recharts format before rendering.

---

#### Right Column — Terminal Price Distribution

A histogram showing the distribution of terminal (final day) prices across all simulation paths.

**Rendering rules:**
- Bin the terminal prices into 40 buckets
- Bars to the left of current price: muted red
- Bars to the right of current price: accent green `#1d6b35`
- A vertical reference line at the current price labeled `Current`
- A vertical reference line at the expected price labeled `Expected`
- X-axis: price in USD
- Y-axis: frequency (count of paths in each bin)
- Chart title: `"Terminal Price Distribution — {num_simulations} Paths"`

**Chart library:** Use `recharts` `BarChart`.

---

### 5. Percentile Table

Full-width table below the two charts. Displays the percentile breakdown from `results.percentiles`.

**Columns:**

| Percentile | Simulated Price | Return vs. Current |
|---|---|---|
| 5th | `$216.01` | `-41.7%` |
| 10th | `$255.05` | `-30.2%` |
| 25th | `$331.15` | `-9.4%` |
| 50th | `$436.78` | `+19.5%` |
| 75th | `$576.82` | `+57.8%` |
| 90th | `$740.43` | `+102.6%` |
| 95th | `$859.33` | `+135.1%` |

**Styling:**
- Monospace font throughout
- Return column: green for positive values, red for negative
- 50th percentile row has a subtle highlight — slightly lighter background
- No borders, use row padding and subtle dividers only

---

## API Integration

**Endpoint:**
```
GET /monte-carlo/{ticker}?num_simulations=10000&num_days=252&lookback_days=365
```

**Expected response shape:**
```json
{
  "ticker": "AAPL",
  "current_price": 365.49,
  "expected_price": 476.66,
  "expected_return": 0.2862,
  "upside_probability": 0.655,
  "downside_probability": 0.345,
  "percentiles": {
    "5th": 216.01,
    "10th": 255.05,
    "25th": 331.15,
    "50th": 436.78,
    "75th": 576.82,
    "90th": 740.43,
    "95th": 859.33
  },
  "simulation_paths": [[165.49, 367.20, "..."], ["..."]]
}
```

**Loading state:** While the request is in flight, show `RUNNING...` on the button and a subtle pulsing indicator in the results area. Do not clear previous results until new results arrive.

**Error state:** If the API returns an error (bad ticker, no data), display an inline error message below the input bar in red monospace text. Do not crash the component.

**Swap point:** The base API URL should be defined in a single constant at the top of the file:
```javascript
// SWAP: replace with Bloomberg BLPAPI endpoint when available
const API_BASE = 'http://localhost:8000'
```

---

## Data Processing Notes

The `simulation_paths` array from the API is shape `[num_simulations, num_days]`. Process client-side before passing to recharts.

**For the path chart** — sample 200 random paths and transpose into recharts format where each entry represents one day:
```javascript
// { day: 0, path_0: 365.49, path_1: 364.20, path_2: 366.01, ... }
```

**For the histogram** — extract terminal prices and bin client-side:
```javascript
const terminalPrices = simulationPaths.map(path => path[path.length - 1])
// Bucket into 40 equal-width bins between min and max terminal price
```

---

## Technical Constraints

- React with plain JavaScript only — no TypeScript
- `recharts` for all charts
- All other styling in a single CSS file
- No external dependencies beyond React and recharts
- No placeholder images — all visual elements must be CSS, SVG, or chart-rendered
- Responsive down to tablet width

---

## Deliverables

```
src/
  tools/
    MonteCarloTool.js
    MonteCarloTool.css
```

No boilerplate comments. Production-quality code only.