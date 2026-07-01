export default function SectionHeader({ eyebrow, title, subtitle, className = '' }) {
  return (
    <header className={className}>
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <h2 className="section-title">{title}</h2>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
    </header>
  );
}
