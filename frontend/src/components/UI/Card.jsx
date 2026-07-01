export default function Card({ tone = 'light', className = '', ...props }) {
  const toneClass = tone === 'dark' ? 'ui-card--dark' : '';
  return <article className={`ui-card ${toneClass} ${className}`.trim()} {...props} />;
}
