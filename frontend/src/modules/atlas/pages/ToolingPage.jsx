import { useMemo, useState } from 'react';
import AtlasScoreTool from '../components/AtlasScoreTool.jsx';
import MonteCarloTool from '../components/MonteCarloTool.jsx';
import './ToolingPage.css';

const TOOLS = [
  {
    id: 'monte-carlo',
    title: 'Monte Carlo Simulation',
    description:
      'Runs terminal price distribution simulations with configurable paths and horizons.',
    status: 'LIVE',
  },
  {
    id: 'atlas-score',
    title: 'Atlas Score',
    description:
      'A 0-100 composite quality score blending financials, market performance, valuation, analyst sentiment, technicals, and earnings.',
    status: 'LIVE',
  }
];

function PlusArrowIcon() {
  return (
    <svg className="qt-plus-arrow" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 5 H13 V11 H19 V13 H13 V19 H11 V13 H5 V11 H11 Z" />
      <path d="M16 12 H22 M20 10 L22 12 L20 14" />
    </svg>
  );
}

function ToolCard({ tool, onSelect }) {
  const isLive = tool.status === 'LIVE';

  function handleClick() {
    if (!isLive) return;
    onSelect(tool.id);
  }

  function handleKeyDown(event) {
    if (!isLive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }

  return (
    <article
      className={`qt-card ${isLive ? 'qt-card--live' : 'qt-card--locked'}`}
      aria-labelledby={`${tool.id}-title`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isLive ? 'button' : undefined}
      tabIndex={isLive ? 0 : undefined}
    >
      <div className="qt-card__header">
        <h2 id={`${tool.id}-title`} className="qt-card__title">
          {tool.title}
        </h2>
        <span
          className={`qt-card__badge ${
            isLive ? 'qt-card__badge--live' : 'qt-card__badge--soon'
          }`}
        >
          {tool.status}
        </span>
      </div>
      <p className="qt-card__desc">{tool.description}</p>
      <div className="qt-card__footer">
        <PlusArrowIcon />
      </div>
    </article>
  );
}

export default function ToolingPage() {
  const [query, setQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState(null);

  const filteredTools = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return TOOLS;

    return TOOLS.filter((tool) => {
      const haystack = `${tool.title} ${tool.description}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query]);

  function handleAddTool() {
    console.log('add tool');
  }

  if (selectedTool === 'monte-carlo') {
    return <MonteCarloTool onBack={() => setSelectedTool(null)} />;
  }

  if (selectedTool === 'atlas-score') {
    return <AtlasScoreTool onBack={() => setSelectedTool(null)} />;
  }

  return (
    <div className="qt">
      <main className="qt-main">
        <div className="qt-page">
          <header className="qt-page__header">
            <h1 className="qt-page__title">Quant Tooling</h1>
            <p className="qt-page__subtitle">Select a tool to begin.</p>
          </header>

          <div className="qt-toolbar">
            <label className="qt-search">
              <span className="qt-search__label">Search tools</span>
              <input
                type="search"
                className="qt-search__input"
                placeholder="Filter by name or description..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="qt-add"
              onClick={handleAddTool}
              aria-label="Add tool"
            >
              <PlusArrowIcon />
            </button>
          </div>

          {filteredTools.length > 0 ? (
            <div className="qt-grid">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onSelect={setSelectedTool}
                />
              ))}
            </div>
          ) : (
            <p className="qt-empty">No tools match your search.</p>
          )}
        </div>
      </main>

      <footer className="qt-footer">
        <div className="qt-footer__inner">
          <span className="qt-footer__brand">
            Ohio University Student Equity Management Group
          </span>
          <span className="qt-footer__meta">Atlas v0.1 — Internal Use Only</span>
        </div>
      </footer>
    </div>
  );
}
