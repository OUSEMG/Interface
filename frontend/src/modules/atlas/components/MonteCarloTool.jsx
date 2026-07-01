import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiFetch } from '../../../utils/api.js';
import './MonteCarloTool.css';

// SWAP: replace with Bloomberg BLPAPI endpoint when available
const API_BASE = '/api';

const LOOKBACK_OPTIONS = [
  { label: '180 days', value: 180 },
  { label: '365 days', value: 365 },
  { label: '730 days', value: 730 },
];

const PERCENTILE_ROWS = ['5th', '10th', '25th', '50th', '75th', '90th', '95th'];
const MAX_PATHS = 200;
const HISTOGRAM_BINS = 40;

function formatUsd(value) {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value) {
  const pct = value * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

function validateInputs({ ticker, numSimulations, numDays }) {
  if (!ticker.trim()) return 'Ticker is required';
  if (numSimulations < 1000 || numSimulations > 100000) {
    return 'Simulations must be between 1,000 and 100,000';
  }
  if (numDays < 21 || numDays > 504) {
    return 'Trading days must be between 21 and 504';
  }
  return null;
}

function samplePaths(paths, maxPaths) {
  if (paths.length <= maxPaths) return paths;
  const indices = new Set();
  while (indices.size < maxPaths) {
    indices.add(Math.floor(Math.random() * paths.length));
  }
  return [...indices].map((index) => paths[index]);
}

function buildPathChartData(simulationPaths, medianPath) {
  const sampled = samplePaths(simulationPaths, MAX_PATHS);
  const numDays = sampled[0]?.length || medianPath.length;

  return Array.from({ length: numDays }, (_, day) => {
    const point = { day };
    sampled.forEach((path, index) => {
      point[`path_${index}`] = path[day];
    });
    point.median = medianPath[day];
    return point;
  });
}

function buildHistogramData(terminalPrices, currentPrice, binCount) {
  const min = Math.min(...terminalPrices);
  const max = Math.max(...terminalPrices);
  const span = max - min || 1;
  const width = span / binCount;

  const bins = Array.from({ length: binCount }, (_, index) => {
    const start = min + index * width;
    const end = index === binCount - 1 ? max : start + width;
    const midpoint = (start + end) / 2;
    return {
      price: midpoint,
      count: 0,
      side: midpoint < currentPrice ? 'down' : 'up',
    };
  });

  terminalPrices.forEach((price) => {
    let index = Math.floor((price - min) / width);
    if (index >= binCount) index = binCount - 1;
    if (index < 0) index = 0;
    bins[index].count += 1;
  });

  return bins;
}

async function fetchMonteCarlo({ ticker, numSimulations, numDays, lookbackDays }) {
  const params = new URLSearchParams({
    num_simulations: String(numSimulations),
    num_days: String(numDays),
    lookback_days: String(lookbackDays),
  });

  const response = await apiFetch(
    `${API_BASE}/monte-carlo/${encodeURIComponent(ticker)}?${params}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to run Monte Carlo simulation');
  }

  return response.json();
}

function SummaryCard({ label, value, tone }) {
  return (
    <article className="mc-metric">
      <p className="mc-metric__label">{label}</p>
      <p className={`mc-metric__value ${tone ? `mc-metric__value--${tone}` : ''}`}>
        {value}
      </p>
    </article>
  );
}

export default function MonteCarloTool({ onBack }) {
  const [ticker, setTicker] = useState('AAPL');
  const [numSimulations, setNumSimulations] = useState(10000);
  const [numDays, setNumDays] = useState(252);
  const [lookbackDays, setLookbackDays] = useState(365);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasRun, setHasRun] = useState(false);

  const pathChartData = useMemo(() => {
    if (!results) return [];
    return buildPathChartData(results.simulation_paths, results.median_path);
  }, [results]);

  const pathKeys = useMemo(() => {
    if (!pathChartData.length) return [];
    return Object.keys(pathChartData[0]).filter((key) => key.startsWith('path_'));
  }, [pathChartData]);

  const histogramData = useMemo(() => {
    if (!results) return [];
    const terminalPrices =
      results.terminal_prices ||
      results.simulation_paths.map((path) => path[path.length - 1]);
    return buildHistogramData(terminalPrices, results.current_price, HISTOGRAM_BINS);
  }, [results]);

  async function handleRun() {
    const validationError = validateInputs({ ticker, numSimulations, numDays });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setHasRun(true);

    try {
      const data = await fetchMonteCarlo({
        ticker: ticker.trim().toUpperCase(),
        numSimulations,
        numDays,
        lookbackDays,
      });
      setResults(data);
    } catch (runError) {
      setError(runError.message);
    } finally {
      setLoading(false);
    }
  }

  const showResults = hasRun && results;
  const expectedReturnTone =
    results && results.expected_return >= 0 ? 'positive' : 'negative';

  return (
    <div className="mc">
      <div className="mc-controls">
        <div className="mc-controls__inner">
          <button type="button" className="mc-back" onClick={onBack}>
            ← Tools
          </button>
          <h1 className="mc-page-title">Monte Carlo Simulation</h1>
          <label className="mc-field">
            <span className="mc-field__label">Ticker</span>
            <input
              type="text"
              className="mc-field__input"
              value={ticker}
              onChange={(event) => setTicker(event.target.value.toUpperCase())}
              placeholder="AAPL"
            />
          </label>

          <label className="mc-field">
            <span className="mc-field__label">Simulations</span>
            <input
              type="number"
              className="mc-field__input"
              min={1000}
              max={100000}
              value={numSimulations}
              onChange={(event) => setNumSimulations(Number(event.target.value))}
            />
          </label>

          <label className="mc-field">
            <span className="mc-field__label">Trading Days</span>
            <input
              type="number"
              className="mc-field__input"
              min={21}
              max={504}
              value={numDays}
              onChange={(event) => setNumDays(Number(event.target.value))}
            />
          </label>

          <label className="mc-field">
            <span className="mc-field__label">Lookback Period</span>
            <select
              className="mc-field__input"
              value={lookbackDays}
              onChange={(event) => setLookbackDays(Number(event.target.value))}
            >
              {LOOKBACK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="mc-run"
            onClick={handleRun}
            disabled={loading}
          >
            {loading ? 'RUNNING...' : 'RUN SIMULATION'}
          </button>
        </div>

        {error ? <p className="mc-error">{error}</p> : null}
      </div>

      <main className="mc-main">
        {!hasRun ? (
          <p className="mc-waiting">&gt; awaiting simulation parameters</p>
        ) : null}

        {hasRun ? (
          <section className="mc-metrics" aria-label="Simulation summary">
            <SummaryCard
              label="Current Price"
              value={results ? formatUsd(results.current_price) : '—'}
            />
            <SummaryCard
              label="Expected Price"
              value={results ? formatUsd(results.expected_price) : '—'}
            />
            <SummaryCard
              label="Expected Return"
              value={results ? formatPercent(results.expected_return) : '—'}
              tone={results ? expectedReturnTone : undefined}
            />
            <SummaryCard
              label="Upside Probability"
              value={
                results ? `${(results.upside_probability * 100).toFixed(1)}%` : '—'
              }
            />
            <SummaryCard
              label="Downside Probability"
              value={
                results ? `${(results.downside_probability * 100).toFixed(1)}%` : '—'
              }
            />
          </section>
        ) : null}

        {loading ? <p className="mc-loading">Running simulation...</p> : null}

        {showResults ? (
          <>
            <section className="mc-charts">
              <article className="mc-panel">
                <header className="mc-panel__header">
                  <h2 className="mc-panel__title">
                    {results.ticker} — Simulated Price Paths
                  </h2>
                </header>
                <div className="mc-panel__body">
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={pathChartData}>
                      <CartesianGrid stroke="var(--color-border)" vertical={false} />
                      <XAxis
                        dataKey="day"
                        stroke="var(--color-text-muted)"
                        tick={{ fontSize: 11, fontFamily: 'Inter' }}
                      />
                      <YAxis
                        stroke="var(--color-text-muted)"
                        tick={{ fontSize: 11, fontFamily: 'Inter' }}
                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          fontFamily: 'Inter',
                          fontSize: 12,
                        }}
                        formatter={(value) => formatUsd(value)}
                        labelFormatter={(label) => `Day ${label}`}
                      />
                      <ReferenceLine
                        y={results.current_price}
                        stroke="var(--color-text-muted)"
                        strokeDasharray="4 4"
                      />
                      {pathKeys.map((key) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke="#1d6b35"
                          strokeWidth={1}
                          dot={false}
                          isAnimationActive={false}
                          opacity={0.1}
                        />
                      ))}
                      <Line
                        type="monotone"
                        dataKey="median"
                        stroke="var(--color-text-primary)"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="mc-panel">
                <header className="mc-panel__header">
                  <h2 className="mc-panel__title">
                    Terminal Price Distribution — {results.num_simulations} Paths
                  </h2>
                </header>
                <div className="mc-panel__body">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={histogramData}>
                      <CartesianGrid stroke="var(--color-border)" vertical={false} />
                      <XAxis
                        dataKey="price"
                        stroke="var(--color-text-muted)"
                        tick={{ fontSize: 11, fontFamily: 'Inter' }}
                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                      />
                      <YAxis
                        stroke="var(--color-text-muted)"
                        tick={{ fontSize: 11, fontFamily: 'Inter' }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          fontFamily: 'Inter',
                          fontSize: 12,
                        }}
                        formatter={(value) => [`${value} paths`, 'Count']}
                        labelFormatter={(label) => formatUsd(label)}
                      />
                      <ReferenceLine
                        x={results.current_price}
                        stroke="var(--color-text-muted)"
                        label={{
                          value: 'Current',
                          position: 'insideTopLeft',
                          fill: 'var(--color-text-muted)',
                          fontSize: 11,
                        }}
                      />
                      <ReferenceLine
                        x={results.expected_price}
                        stroke="#1d6b35"
                        label={{
                          value: 'Expected',
                          position: 'insideTopRight',
                          fill: '#1d6b35',
                          fontSize: 11,
                        }}
                      />
                      <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                        {histogramData.map((entry) => (
                          <Cell
                            key={`bin-${entry.price}`}
                            fill={entry.side === 'down' ? 'var(--color-red-text)' : 'var(--color-accent)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>

            <section className="mc-table-wrap">
              <table className="mc-table">
                <thead>
                  <tr>
                    <th>Percentile</th>
                    <th>Simulated Price</th>
                    <th>Return vs. Current</th>
                  </tr>
                </thead>
                <tbody>
                  {PERCENTILE_ROWS.map((label) => {
                    const price = results.percentiles[label];
                    const returnVsCurrent =
                      (price - results.current_price) / results.current_price;
                    const tone = returnVsCurrent >= 0 ? 'positive' : 'negative';

                    return (
                      <tr
                        key={label}
                        className={label === '50th' ? 'mc-table__row--median' : undefined}
                      >
                        <td>{label}</td>
                        <td>{formatUsd(price)}</td>
                        <td className={`mc-table__return mc-table__return--${tone}`}>
                          {formatPercent(returnVsCurrent)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
