import { useNavigate } from 'react-router-dom';
import './ProfDevLanding.css';

const TOOLS = [
  {
    id: 'alumni',
    title: 'Alumni Directory',
    description: 'Search and browse the full OUSEMG alumni network — 197 members across industries.',
    path: '/professional-development/alumni',
    status: 'LIVE',
  },
  {
    id: 'applications',
    title: 'Application Tracker',
    description: 'Track recruiting activity — firms, roles, stages, and outcomes. Saved locally in your browser.',
    path: '/professional-development/applications',
    status: 'LIVE',
  },
];

function ToolCard({ tool, onSelect }) {
  const isLive = tool.status === 'LIVE';

  function handleClick() {
    if (!isLive) return;
    onSelect(tool.path);
  }

  function handleKeyDown(event) {
    if (!isLive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(tool.path);
    }
  }

  return (
    <article
      className={`pd-card ${isLive ? 'pd-card--live' : 'pd-card--locked'}`}
      aria-labelledby={`${tool.id}-title`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isLive ? 'button' : undefined}
      tabIndex={isLive ? 0 : undefined}
    >
      <div className="pd-card__header">
        <h2 id={`${tool.id}-title`} className="pd-card__title">
          {tool.title}
        </h2>
        <span className={`pd-card__badge ${isLive ? 'pd-card__badge--live' : ''}`}>
          {tool.status}
        </span>
      </div>
      <p className="pd-card__desc">{tool.description}</p>
    </article>
  );
}

export default function ProfDevLanding() {
  const navigate = useNavigate();

  return (
    <div className="pd">
      <main className="pd-main">
        <div className="pd-page">
          <header className="pd-page__header">
            <p className="pd-page__label">OUSEMG / Career Resources</p>
            <h1 className="pd-page__title">Professional Development</h1>
            <p className="pd-page__subtitle">Select a tool to begin.</p>
          </header>

          <div className="pd-grid">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onSelect={navigate} />
            ))}
          </div>
        </div>
      </main>

      <footer className="pd-footer">
        <div className="pd-footer__inner">
          <span className="pd-footer__brand">
            Ohio University Student Equity Management Group
          </span>
          <span className="pd-footer__meta">Interface v0.1 — Internal Use Only</span>
        </div>
      </footer>
    </div>
  );
}
