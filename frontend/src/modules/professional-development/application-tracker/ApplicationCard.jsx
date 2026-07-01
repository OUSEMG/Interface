import { useRef } from 'react';
import FirmLogo from './FirmLogo.jsx';
import { stageColorClass } from './stageConfig.js';
import { cardTimingLabel, DRAG_MIME } from './utils.js';

export default function ApplicationCard({
  application,
  onSelect,
  onDragStart,
  onDragEnd,
  isDragging = false,
}) {
  const timing = cardTimingLabel(application);
  const didDragRef = useRef(false);

  function handleDragStart(event) {
    didDragRef.current = true;
    event.dataTransfer.setData(DRAG_MIME, application.id);
    event.dataTransfer.effectAllowed = 'move';
    onDragStart?.(application.id);
  }

  function handleDragEnd() {
    onDragEnd?.();
    window.setTimeout(() => {
      didDragRef.current = false;
    }, 0);
  }

  function handleClick() {
    if (didDragRef.current) return;
    onSelect(application.id);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(application.id);
    }
  }

  return (
    <div
      className={`at-card ${isDragging ? 'at-card--dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-grabbed={isDragging}
    >
      <div className="at-card__top">
        <FirmLogo
          firmName={application.firm_name}
          firmDomain={application.firm_domain}
          size={32}
        />
        <span className={`at-stage ${stageColorClass(application.stage)}`}>
          {application.stage}
        </span>
      </div>
      <p className="at-card__firm">{application.firm_name}</p>
      <p className="at-card__role">{application.role}</p>
      <div className="at-card__footer">
        <span className="at-badge">{application.role_type}</span>
        {timing ? <span className="at-card__timing">{timing}</span> : null}
      </div>
    </div>
  );
}
