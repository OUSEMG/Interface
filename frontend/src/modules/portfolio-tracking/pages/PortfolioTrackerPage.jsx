import { useEffect, useMemo, useState } from 'react';
import { fetchPortfolioSnapshot, PORTFOLIOS } from '../api/portfolioTracker.js';
import './PortfolioTrackerPage.css';

const NUMERIC_COLUMNS = [
  { key: 'shares', label: 'Shares' },
  { key: 'current_price', label: 'Current Price' },
  { key: 'current_value', label: 'Current Value' },
  { key: 'snapshot_value', label: 'Snapshot Value' },
  { key: 'gain_loss', label: 'Gain / Loss' },
  { key: 'return_since_snapshot', label: 'Return Since' },
  { key: 'ytd_return', label: 'YTD Return' },
  { key: 'weight', label: 'Weight' },
];

function formatCurrency(value, { cents = false } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(value);
}

function formatPrice(value) {
  return formatCurrency(value, { cents: true });
}

function formatPercent(value, { signed = true } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(2)}%`;
}

function formatShares(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

function formatRefreshTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function valueTone(value) {
  if (value > 0) return 'pt-positive';
  if (value < 0) return 'pt-negative';
  return '';
}

function SkeletonTable() {
  return (
    <div className="pt-skeleton" aria-label="Loading portfolio data">
      {Array.from({ length: 8 }).map((_, rowIndex) => (
        <div className="pt-skeleton__row" key={rowIndex}>
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <span className="pt-skeleton__cell" key={cellIndex} />
          ))}
        </div>
      ))}
    </div>
  );
}

function MetricCard({ label, value, subLabel, tone }) {
  return (
    <article className="pt-metric">
      <p className="pt-metric__label">{label}</p>
      <p className={`pt-metric__value ${tone || ''}`}>{value}</p>
      <p className="pt-metric__sub">{subLabel}</p>
    </article>
  );
}

export default function PortfolioTrackerPage() {
  const [selectedPortfolio, setSelectedPortfolio] = useState('combined');
  const [dataByPortfolio, setDataByPortfolio] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState({ key: 'weight', direction: 'desc' });

  const activeData = dataByPortfolio[selectedPortfolio];
  const summary = activeData?.summary;
  const holdings = activeData?.holdings || [];

  async function loadSnapshot(portfolio = selectedPortfolio, options = {}) {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchPortfolioSnapshot(portfolio, options);
      setDataByPortfolio((current) => ({
        ...current,
        [portfolio]: result,
      }));
    } catch (snapshotError) {
      setError(snapshotError.message || 'Could not fetch prices. Showing last known data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSnapshot('combined');
  }, []);

  function handlePortfolioChange(portfolio) {
    setSelectedPortfolio(portfolio);
    setSort({ key: 'weight', direction: 'desc' });
    if (!dataByPortfolio[portfolio]) {
      loadSnapshot(portfolio);
    }
  }

  function handleSort(key) {
    setSort((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return { key, direction: 'desc' };
    });
  }

  const sortedHoldings = useMemo(() => {
    return [...holdings].sort((left, right) => {
      const leftValue = left[sort.key] ?? Number.NEGATIVE_INFINITY;
      const rightValue = right[sort.key] ?? Number.NEGATIVE_INFINITY;
      const multiplier = sort.direction === 'asc' ? 1 : -1;
      return (leftValue - rightValue) * multiplier;
    });
  }, [holdings, sort]);

  const snapshotLabel = activeData?.snapshot_date || '6/19';
  const lastRefreshLabel = formatRefreshTime(activeData?.fetched_at);
  const sourceLabel = activeData?.cache_hit ? 'Cache' : 'Live';

  return (
    <main className="pt">
      <section className="pt-hero">
        <div>
          <p className="pt-eyebrow">Portfolio Tracking</p>
          <h1>Live Portfolio Performance</h1>
          <p className="pt-hero__copy">
            Manual yfinance refreshes against the static holdings ledger in the repo-root data folder.
          </p>
        </div>

        <button
          type="button"
          className="pt-refresh"
          onClick={() => loadSnapshot(selectedPortfolio, { forceRefresh: true })}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Prices'}
        </button>
      </section>

      <section className="pt-controls" aria-label="Portfolio selector">
        {PORTFOLIOS.map((portfolio) => (
          <button
            key={portfolio.key}
            type="button"
            className={`pt-selector ${selectedPortfolio === portfolio.key ? 'pt-selector--active' : ''}`}
            onClick={() => handlePortfolioChange(portfolio.key)}
          >
            {portfolio.label}
          </button>
        ))}
      </section>

      {error ? (
        <div className="pt-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => loadSnapshot(selectedPortfolio, { forceRefresh: true })}>
            Retry
          </button>
        </div>
      ) : null}

      <section className="pt-summary" aria-label="Portfolio summary">
        <MetricCard
          label="Total AUM"
          value={formatCurrency(summary?.total_aum)}
          subLabel={selectedPortfolio === 'combined' ? 'Combined' : activeData?.portfolio}
        />
        <MetricCard
          label={`Return Since ${snapshotLabel}`}
          value={formatPercent(summary?.return_since_snapshot)}
          subLabel={`vs SPY: ${formatPercent(summary?.benchmark_return_since_snapshot)}`}
          tone={valueTone(summary?.return_since_snapshot)}
        />
        <MetricCard
          label="YTD Return"
          value={formatPercent(summary?.ytd_return)}
          subLabel={`vs SPY: ${formatPercent(summary?.benchmark_ytd_return)}`}
          tone={valueTone(summary?.ytd_return)}
        />
        <MetricCard
          label="Last Refreshed"
          value={lastRefreshLabel}
          subLabel={sourceLabel}
        />
      </section>

      <section className="pt-table-card">
        <div className="pt-table-card__header">
          <div>
            <h2>Holdings</h2>
            <p>Default sorted by portfolio weight. Click numeric headers to sort.</p>
          </div>
        </div>

        {loading && !activeData ? (
          <SkeletonTable />
        ) : (
          <div className="pt-table-wrap">
            <table className="pt-table">
              <thead>
                <tr>
                  <th scope="col">Security</th>
                  <th scope="col">Ticker</th>
                  {NUMERIC_COLUMNS.map((column) => (
                    <th scope="col" key={column.key}>
                      <button
                        type="button"
                        className="pt-sort"
                        onClick={() => handleSort(column.key)}
                      >
                        {column.label}
                        {sort.key === column.key ? (
                          <span>{sort.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                        ) : null}
                      </button>
                    </th>
                  ))}
                  <th scope="col">Asset Class</th>
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((holding) => (
                  <tr key={`${holding.portfolio || selectedPortfolio}-${holding.ticker}-${holding.name}`}>
                    <td>
                      <span className="pt-security">{holding.name}</span>
                      {holding.portfolio && selectedPortfolio === 'combined' ? (
                        <span className="pt-security__meta">{holding.portfolio}</span>
                      ) : null}
                    </td>
                    <td className="pt-ticker">{holding.ticker}</td>
                    <td>{formatShares(holding.shares)}</td>
                    <td>
                      {formatPrice(holding.current_price)}
                      {holding.price_stale ? (
                        <span
                          className="pt-stale"
                          title="Price unavailable — showing snapshot value."
                          aria-label="Price unavailable, showing snapshot value"
                        >
                          ⚠
                        </span>
                      ) : null}
                    </td>
                    <td>{formatCurrency(holding.current_value)}</td>
                    <td>{formatCurrency(holding.snapshot_value)}</td>
                    <td>{formatCurrency(holding.gain_loss)}</td>
                    <td className={valueTone(holding.return_since_snapshot)}>
                      {formatPercent(holding.return_since_snapshot)}
                    </td>
                    <td className={valueTone(holding.ytd_return)}>
                      {formatPercent(holding.ytd_return)}
                    </td>
                    <td>{formatPercent(holding.weight, { signed: false })}</td>
                    <td>{holding.asset_class || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
