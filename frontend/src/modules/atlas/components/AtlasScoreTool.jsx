import { useState } from 'react';
import { apiFetch } from '../../../utils/api.js';
import { downloadScoreCard } from '../utils/scoreCardImage.js';
import './AtlasScoreTool.css';

// SWAP: replace with Bloomberg BLPAPI endpoint when available
const API_BASE = '/api';

const PILLAR_BLURBS = {
  financial: 'Leverage, liquidity, and profitability from the balance sheet.',
  market: 'Risk-adjusted returns over the past year versus the S&P 500.',
  valuation: 'What you pay per unit of earnings, book value, and growth.',
  anr: 'Analyst consensus rating, price-target upside, and coverage depth.',
  technical: 'Trend and momentum: RSI, moving averages, Bollinger position.',
  earnings: 'EPS surprise history, beat consistency, and earnings growth.',
};

function scoreTone(score) {
  if (score === null || score === undefined) return 'na';
  if (score >= 70) return 'good';
  if (score >= 40) return 'mid';
  return 'bad';
}

async function fetchAtlasScore(ticker) {
  const response = await apiFetch(
    `${API_BASE}/atlas-score/${encodeURIComponent(ticker)}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to compute Atlas Score');
  }

  return response.json();
}

function ScoreRing({ score }) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;

  return (
    <div className="as-ring">
      <svg viewBox="0 0 160 160" className="as-ring__svg" aria-hidden="true">
        <circle
          className="as-ring__track"
          cx="80"
          cy="80"
          r={radius}
          strokeWidth="13"
        />
        <circle
          className={`as-ring__fill as-ring__fill--${scoreTone(score)}`}
          cx="80"
          cy="80"
          r={radius}
          strokeWidth="13"
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className="as-ring__center">
        <span className={`as-ring__score as-score--${scoreTone(score)}`}>
          {score}
        </span>
        <span className="as-ring__denom">/100</span>
      </div>
    </div>
  );
}

function PillarTile({ pillar }) {
  const tone = scoreTone(pillar.score);

  return (
    <article className="as-pillar">
      <div className="as-pillar__header">
        <h3 className="as-pillar__name">{pillar.label}</h3>
        <span className={`as-pillar__score as-score--${tone}`}>
          {pillar.score === null ? '—' : pillar.score}
        </span>
      </div>
      <div className="as-bar">
        <div
          className={`as-bar__fill as-bar__fill--${tone}`}
          style={{ width: `${pillar.score ?? 0}%` }}
        />
      </div>
    </article>
  );
}

function PillarDetail({ pillar }) {
  return (
    <article className="as-panel">
      <header className="as-panel__header">
        <h2 className="as-panel__title">
          {pillar.label}
          <span className="as-panel__weight">
            {Math.round(pillar.weight * 100)}% of composite
          </span>
        </h2>
        <span className={`as-panel__score as-score--${scoreTone(pillar.score)}`}>
          {pillar.score === null ? 'N/A' : pillar.score}
        </span>
      </header>
      <p className="as-panel__blurb">{PILLAR_BLURBS[pillar.id]}</p>
      <table className="as-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Sub-Score</th>
            <th>Weight</th>
          </tr>
        </thead>
        <tbody>
          {pillar.metrics.map((metric) => (
            <tr key={metric.id}>
              <td>{metric.label}</td>
              <td className="as-table__value">{metric.formatted}</td>
              <td className={`as-table__score as-score--${scoreTone(metric.score)}`}>
                {metric.score === null ? 'N/A' : metric.score.toFixed(0)}
              </td>
              <td className="as-table__weight">
                {Math.round(metric.weight * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

function Methodology() {
  return (
    <article className="as-panel as-methodology">
      <header className="as-panel__header">
        <h2 className="as-panel__title">How the Atlas Score works</h2>
      </header>
      <div className="as-methodology__body">
        <p>
          The Atlas Score condenses a company&apos;s overall quality into a single
          0&ndash;100 number. It blends six pillars &mdash; each scored 0&ndash;100
          on its own &mdash; using fixed weights: <strong>Financial Health (25%)</strong>,{' '}
          <strong>Market Performance (20%)</strong>, <strong>Valuation (20%)</strong>,{' '}
          <strong>Analyst Recommendations (15%)</strong>,{' '}
          <strong>Technical Indicators (10%)</strong>, and{' '}
          <strong>Earnings Quality (10%)</strong>.
        </p>
        <p>
          Every underlying metric (Sharpe ratio, P/E, RSI, EPS surprise, and so on)
          is normalized onto a 0&ndash;100 scale between a documented &ldquo;worst&rdquo;
          and &ldquo;best&rdquo; bound &mdash; for example, a trailing P/E of 10x scores
          100 and 50x scores 0. Metrics where both extremes are risky, like RSI or
          beta, score highest at a neutral sweet spot. Missing data is dropped and
          the remaining metrics are re-weighted, so one unavailable field never
          sinks a score.
        </p>
        <p>
          Scores of <strong>70+</strong> are strong, <strong>40&ndash;69</strong> are
          balanced or mixed, and <strong>below 40</strong> flags weakness. Full
          methodology, including every bound and weight, lives in{' '}
          <code>modules/atlas/docs/atlas_score.md</code>.
        </p>
      </div>
    </article>
  );
}

export default function AtlasScoreTool({ onBack }) {
  const [ticker, setTicker] = useState('AAPL');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleRun() {
    if (!ticker.trim()) {
      setError('Ticker is required');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setHasRun(true);

    try {
      const data = await fetchAtlasScore(ticker.trim().toUpperCase());
      setResult(data);
    } catch (runError) {
      setError(runError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!result || downloading) return;
    setDownloading(true);
    try {
      await downloadScoreCard(result);
    } finally {
      setDownloading(false);
    }
  }

  const coverageRatio = result
    ? `${result.coverage.metrics_scored}/${result.coverage.metrics_total}`
    : null;

  return (
    <div className="as">
      <div className="as-controls">
        <div className="as-controls__inner">
          <button type="button" className="as-back" onClick={onBack}>
            ← Tools
          </button>
          <h1 className="as-page-title">Atlas Score</h1>
          <label className="as-field">
            <span className="as-field__label">Ticker</span>
            <input
              type="text"
              className="as-field__input"
              value={ticker}
              onChange={(event) => setTicker(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleRun();
              }}
              placeholder="AAPL"
            />
          </label>
          <button
            type="button"
            className="as-run"
            onClick={handleRun}
            disabled={loading}
          >
            {loading ? 'SCORING...' : 'COMPUTE SCORE'}
          </button>
        </div>

        {error ? <p className="as-error">{error}</p> : null}
      </div>

      <main className="as-main">
        {!hasRun ? (
          <p className="as-waiting">&gt; enter a ticker to compute its Atlas Score</p>
        ) : null}

        {loading ? (
          <p className="as-loading">Pulling fundamentals, prices, and estimates...</p>
        ) : null}

        {result ? (
          <>
            <section className="as-hero" aria-label="Atlas Score card">
              <div className="as-card" data-scorecard>
                <header className="as-card__header">
                  <h2 className="as-card__ticker">{result.ticker}</h2>
                  <p className="as-card__meta">
                    {result.company_name} · {result.as_of}
                  </p>
                </header>

                <ScoreRing score={result.composite_score} />
                <p className="as-card__label">Atlas Score</p>
                <p className={`as-card__rating as-score--${scoreTone(result.composite_score)}`}>
                  {result.rating}
                </p>

                <div className="as-card__grid">
                  {result.pillars.map((pillar) => (
                    <PillarTile key={pillar.id} pillar={pillar} />
                  ))}
                </div>
              </div>

              <aside className="as-side">
                <div className="as-side__stats">
                  <div className="as-stat">
                    <span className="as-stat__label">Last Price</span>
                    <span className="as-stat__value">
                      ${result.current_price.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="as-stat">
                    <span className="as-stat__label">Rating</span>
                    <span className="as-stat__value">{result.rating}</span>
                  </div>
                  <div className="as-stat">
                    <span className="as-stat__label">Data Coverage</span>
                    <span className="as-stat__value">{coverageRatio} metrics</span>
                  </div>
                  <div className="as-stat">
                    <span className="as-stat__label">Benchmark</span>
                    <span className="as-stat__value">{result.benchmark}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="as-download"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? 'RENDERING...' : 'DOWNLOAD SCORE CARD (PNG)'}
                </button>
                <p className="as-side__note">
                  Exports the card as a shareable PNG image.
                </p>
              </aside>
            </section>

            <section className="as-details" aria-label="Pillar breakdowns">
              {result.pillars.map((pillar) => (
                <PillarDetail key={pillar.id} pillar={pillar} />
              ))}
            </section>
          </>
        ) : null}

        {hasRun && !loading && !result && !error ? null : null}

        <Methodology />
      </main>
    </div>
  );
}
