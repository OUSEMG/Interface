export default function Badge({ variant = 'gray', className = '', ...props }) {
  return (
    <span
      className={`ui-badge ui-badge--${variant} ${className}`.trim()}
      {...props}
    />
  );
}
