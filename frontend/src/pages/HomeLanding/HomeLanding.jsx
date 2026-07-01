import { useNavigate } from 'react-router-dom';
import './HomeLanding.css';

const SECTIONS = [
  {
    id: 'atlas',
    eyebrow: 'Analytics',
    title: 'Atlas',
    description: 'Quant tools, portfolio analytics, and modeling workflows for the investment team.',
    path: '/atlas',
    icon: 'AT',
  },
  {
    id: 'professional-development',
    eyebrow: 'Careers',
    title: 'Professional Development',
    description: 'Alumni network, recruiting resources, and application tracking for members.',
    path: '/professional-development',
    icon: 'PD',
  },
  {
    id: 'portfolio',
    eyebrow: 'Performance',
    title: 'Portfolio',
    description: 'Holdings, risk, and performance views for understanding the live portfolio.',
    path: '/portfolio',
    icon: 'PF',
  },
];

function SectionCard({ section, onNavigate }) {
  return (
    <article
      className="if-card"
      aria-labelledby={`${section.id}-title`}
      onClick={() => onNavigate(section.path)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onNavigate(section.path);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="if-card__icon" aria-hidden="true">{section.icon}</div>
      <p className="if-card__eyebrow">{section.eyebrow}</p>
      <h2 id={`${section.id}-title`} className="if-card__title">{section.title}</h2>
      <p className="if-card__description">{section.description}</p>
      <span className="if-card__link">Open workspace</span>
    </article>
  );
}

export default function HomeLanding() {
  const navigate = useNavigate();

  return (
    <div className="if">
      <main className="if-main">
        <section className="if-hero" aria-labelledby="if-hero-title">
          <div className="if-hero__inner">
            <div className="if-hero__rule" aria-hidden="true" />
            <div className="if-hero__content">
              <p className="if-hero__label">Ohio University Student Equity Management Group</p>
              <h1 id="if-hero-title" className="if-hero__title">
                Managing a real portfolio. Building real skills.
              </h1>
              <p className="if-hero__subline">
                A member platform for portfolio tracking, recruiting, and professional development.
              </p>
            </div>
            <button type="button" className="if-hero__cta" onClick={() => navigate('/professional-development')}>
              Explore workspaces
            </button>
          </div>
        </section>

        <section className="if-sections" aria-labelledby="if-sections-heading">
          <header className="if-sections__header">
            <p className="section-eyebrow">Platform</p>
            <h2 id="if-sections-heading" className="section-title">Choose a workspace</h2>
            <p className="section-subtitle">Everything starts from one consistent interface.</p>
          </header>

          <div className="if-sections__grid">
            {SECTIONS.map((section) => (
              <SectionCard key={section.id} section={section} onNavigate={navigate} />
            ))}
          </div>
        </section>
      </main>

      <footer className="if-footer">
        <div className="if-footer__inner">
          <span>Ohio University Student Equity Management Group</span>
          <span>Interface v0.1</span>
        </div>
      </footer>
    </div>
  );
}
