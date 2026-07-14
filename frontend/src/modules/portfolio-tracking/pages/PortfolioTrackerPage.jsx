import { useEffect, useMemo, useState } from 'react';
import { fetchPortfolioSnapshot, PORTFOLIOS } from '../api/portfolioTracker.js';
import './PortfolioTrackerPage.css';

const NUMERIC_COLUMNS = [
  { key: 'shares', label: 'Shares' },
  { key: 'current_price', label: 'Current Price' },
  { key: 'day_change', label: 'Day Change' },
  { key: 'day_gain_loss', label: 'Day P/L' },
  { key: 'market_value', label: 'Market Value' },
  { key: 'gain_loss', label: 'Gain / Loss' },
  { key: 'return_since_snapshot', label: 'Return Since' },
  { key: 'weight', label: 'Weight' },
];

const SORT_OPTIONS = [
  { label: 'Alphabetical', key: 'name', direction: 'asc' },
  { label: 'Today Performance', key: 'day_change_percent', direction: 'desc' },
  { label: 'Today Worst', key: 'day_change_percent', direction: 'asc' },
  { label: 'Total Performance', key: 'return_since_snapshot', direction: 'desc' },
  { label: 'Total Worst', key: 'return_since_snapshot', direction: 'asc' },
  { label: 'Largest Position', key: 'weight', direction: 'desc' },
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

function accountLabel(value) {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1);
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
  const totalDayGainLoss = holdings.reduce(
    (total, holding) => total + (holding.day_gain_loss || 0),
    0
  );
  const totalDayReturn = summary?.total_aum
    ? totalDayGainLoss / (summary.total_aum - totalDayGainLoss)
    : null;

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

  function handlePresetSort(event) {
    const option = SORT_OPTIONS.find((item) => item.label === event.target.value);
    if (!option) return;
    setSort({ key: option.key, direction: option.direction });
  }

  const sortedHoldings = useMemo(() => {
    return [...holdings].sort((left, right) => {
      const multiplier = sort.direction === 'asc' ? 1 : -1;

      if (sort.key === 'name' || sort.key === 'ticker') {
        const leftValue = String(left[sort.key] || '').toLowerCase();
        const rightValue = String(right[sort.key] || '').toLowerCase();
        return leftValue.localeCompare(rightValue) * multiplier;
      }

      const leftValue = left[sort.key];
      const rightValue = right[sort.key];
      const leftMissing = leftValue === null || leftValue === undefined || Number.isNaN(leftValue);
      const rightMissing = rightValue === null || rightValue === undefined || Number.isNaN(rightValue);

      if (leftMissing && rightMissing) return 0;
      if (leftMissing) return 1;
      if (rightMissing) return -1;
      return (leftValue - rightValue) * multiplier;
    });
  }, [holdings, sort]);

  const selectedSortLabel =
    SORT_OPTIONS.find(
      (option) => option.key === sort.key && option.direction === sort.direction
    )?.label || 'Custom';

  const snapshotLabel = activeData?.snapshot_date || '6/19';
  const lastRefreshLabel = formatRefreshTime(activeData?.fetched_at);
  const sourceLabel = activeData?.cache_hit ? 'Cache' : 'Live';

  return (
    <main className="pt">
      <section className="pt-hero">
        <div>
          <p className="pt-eyebrow">Portfolio Tracking</p>
          <h1>Holdings</h1>
          <p className="pt-hero__copy">
            Brokerage-style view of OUSEMG positions from the Excel share file in the repo-root data folder.
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
          label="Market Value"
          value={formatCurrency(summary?.total_aum)}
          subLabel={selectedPortfolio === 'combined' ? 'Combined' : activeData?.portfolio}
        />
        <MetricCard
          label="Day P/L"
          value={formatCurrency(totalDayGainLoss)}
          subLabel={formatPercent(totalDayReturn)}
          tone={valueTone(totalDayGainLoss)}
        />
        <MetricCard
          label={`Return Since ${snapshotLabel}`}
          value={formatPercent(summary?.return_since_snapshot)}
          subLabel={`Gain/loss: ${formatCurrency(summary?.total_gain_loss)}`}
          tone={valueTone(summary?.return_since_snapshot)}
        />
        <MetricCard
          label="Positions"
          value={holdings.length ? String(holdings.length) : '—'}
          subLabel={`${sourceLabel} prices · ${lastRefreshLabel}`}
        />
      </section>

      <section className="pt-table-card">
        <div className="pt-table-card__header">
          <div>
            <h2>Holdings</h2>
            <p>Use a preset sort or click numeric headers to sort directly.</p>
          </div>
          <label className="pt-sort-select">
            <span>Sort by</span>
            <select value={selectedSortLabel} onChange={handlePresetSort}>
              {selectedSortLabel === 'Custom' ? (
                <option value="Custom">Custom</option>
              ) : null}
              {SORT_OPTIONS.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
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
                  {selectedPortfolio === 'combined' ? <th scope="col">Account</th> : null}
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
                    {selectedPortfolio === 'combined' ? (
                      <td className="pt-account">{accountLabel(holding.portfolio)}</td>
                    ) : null}
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
                    <td className={valueTone(holding.day_change)}>
                      {formatPrice(holding.day_change)}
                      <span className="pt-cell-sub">
                        {formatPercent(holding.day_change_percent)}
                      </span>
                    </td>
                    <td className={valueTone(holding.day_gain_loss)}>
                      {formatCurrency(holding.day_gain_loss)}
                    </td>
                    <td>{formatCurrency(holding.market_value)}</td>
                    <td className={valueTone(holding.gain_loss)}>
                      {formatCurrency(holding.gain_loss)}
                    </td>
                    <td className={valueTone(holding.return_since_snapshot)}>
                      {formatPercent(holding.return_since_snapshot)}
                    </td>
                    <td>{formatPercent(holding.weight, { signed: false })}</td>
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
