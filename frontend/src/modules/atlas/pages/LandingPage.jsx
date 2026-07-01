import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const TICKER_ITEMS = [
  'SPX +0.42%',
  'VIX 14.8',
  '10Y 4.21%',
  'HYG −0.11%',
  'DXY +0.08%',
  'BTC 67,420',
  'EUR/USD 1.0842',
  'CRUDE 78.3',
  'GOLD 2,341',
  'NDX +0.67%',
  'RUT −0.19%',
  'SOFR 5.32%',
];

const MODULES = [
  {
    id: 'quant-tooling',
    title: 'Quant Tooling',
    description:
      'Monte Carlo simulation and analytical tools for investment team workflows.',
    active: true,
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="6" y="28" width="8" height="12" />
        <rect x="20" y="20" width="8" height="20" />
        <rect x="34" y="12" width="8" height="28" />
        <polyline points="6,26 20,18 34,10 42,6" />
      </svg>
    ),
  },
  {
    id: 'labs',
    title: 'Labs',
    description:
      'Experimental workspace for members to build and test quant models.',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M16 8 L32 8 L38 20 L24 40 L10 20 Z" />
        <line x1="10" y1="20" x2="38" y2="20" />
        <circle cx="24" cy="14" r="2" />
      </svg>
    ),
  },
];

function TickerBar() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="atlas-ticker" aria-hidden="true">
      <div className="atlas-ticker__track">
        {items.map((item, index) => (
          <span key={`${item}-${index}`} className="atlas-ticker__item">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroGrid() {
  return (
    <div className="atlas-hero__grid" aria-hidden="true">
      <svg className="atlas-hero__grid-svg" preserveAspectRatio="none">
        <defs>
          <pattern
            id="atlas-grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#atlas-grid)" />
      </svg>
      <div className="atlas-hero__scanline" />
      <div className="atlas-hero__pulse">
        {[0, 1, 2].map((ring) => (
          <span key={ring} className="atlas-hero__pulse-ring" />
        ))}
      </div>
    </div>
  );
}

function ModulePanel({ module, onNavigate }) {
  const isActive = module.active;

  function handleClick() {
    if (!isActive || !onNavigate) return;
    onNavigate(module.id);
  }

  function handleKeyDown(event) {
    if (!isActive || !onNavigate) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onNavigate(module.id);
    }
  }

  return (
    <article
      className={`atlas-panel ${isActive ? 'atlas-panel--active' : ''}`}
      aria-labelledby={`${module.id}-title`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isActive ? 'button' : undefined}
      tabIndex={isActive ? 0 : undefined}
    >
      <div className="atlas-panel__header">
        <div className="atlas-panel__icon">{module.icon}</div>
        <span
          className={`atlas-panel__badge ${
            isActive ? 'atlas-panel__badge--live' : ''
          }`}
        >
          {isActive ? (
            'Active'
          ) : (
            <>
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <rect x="3" y="5" width="6" height="5" rx="0.5" />
                <path d="M4 5 V3.5 A2 2 0 0 1 8 3.5 V5" />
              </svg>
              Coming Soon
            </>
          )}
        </span>
      </div>
      <div className="atlas-panel__body">
        <h3 id={`${module.id}-title`} className="atlas-panel__title">
          {module.title}
        </h3>
        <p className="atlas-panel__desc">{module.description}</p>
      </div>
      <div className="atlas-panel__footer">
        <span className="atlas-panel__status">
          {isActive ? 'Module ready' : 'Module locked'}
        </span>
        <span className="atlas-panel__id">{module.id.replace(/-/g, '.')}</span>
      </div>
    </article>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  function handleNavigate(moduleId) {
    if (moduleId === 'quant-tooling') navigate('/atlas/tooling');
  }

  return (
    <div className="atlas">
      <main className="atlas-main">
        <section className="atlas-hero" aria-labelledby="atlas-hero-title">
          <HeroGrid />
          <div className="atlas-hero__content">
            <p className="atlas-hero__label">OUSEMG / Atlas</p>
            <h1 id="atlas-hero-title" className="atlas-hero__title">
              Atlas
            </h1>
            <p className="atlas-hero__subline">
              Quant tools and analytics for the investment team
            </p>
          </div>
          <TickerBar />
        </section>

        <section className="atlas-modules" aria-labelledby="atlas-modules-heading">
          <div className="atlas-modules__header">
            <h2 id="atlas-modules-heading" className="atlas-modules__heading">
              Modules
            </h2>
            <span className="atlas-modules__count">01 / 02 pending activation</span>
          </div>
          <div className="atlas-modules__grid">
            {MODULES.map((module) => (
              <ModulePanel
                key={module.id}
                module={module}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="atlas-footer">
        <div className="atlas-footer__inner">
          <span className="atlas-footer__brand">Ohio University Student Equity Management Group</span>
          <span className="atlas-footer__meta">Atlas v0.1 — Internal Use Only</span>
        </div>
      </footer>
    </div>
  );
}
