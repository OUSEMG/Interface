import { useRef, useState } from 'react';
import ApplicationCard from './ApplicationCard.jsx';
import { ARCHIVED_STAGES, BOARD_COLUMNS } from './stageConfig.js';
import { DRAG_MIME } from './utils.js';

function ColumnCards({ applications, draggingId, onSelect, onDragStart, onDragEnd }) {
  if (applications.length === 0) {
    return <p className="at-board__empty">No applications</p>;
  }

  return applications.map((application) => (
    <ApplicationCard
      key={application.id}
      application={application}
      isDragging={draggingId === application.id}
      onSelect={onSelect}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    />
  ));
}

function DropZone({
  stage,
  applications,
  draggingId,
  dropTarget,
  onSelect,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragLeave,
  onDrop,
  label,
  compact = false,
}) {
  const isActive = dropTarget === stage;

  return (
    <div
      className={`at-board__drop-zone ${compact ? 'at-board__drop-zone--compact' : ''} ${
        isActive ? 'at-board__drop-zone--active' : ''
      }`}
      onDragEnter={(event) => onDragEnter(event, stage)}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDragLeave={(event) => onDragLeave(event, stage)}
      onDrop={(event) => onDrop(event, stage)}
    >
      {label ? <h4 className="at-board__drop-label">{label}</h4> : null}
      <div className="at-board__cards">
        <ColumnCards
          applications={applications}
          draggingId={draggingId}
          onSelect={onSelect}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      </div>
    </div>
  );
}

export default function BoardView({ applications, onSelect, onMoveStage }) {
  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const dragCounterRef = useRef({});

  function handleDragStart(id) {
    setDraggingId(id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDropTarget(null);
    dragCounterRef.current = {};
  }

  function handleDragEnter(event, stage) {
    event.preventDefault();
    if (!draggingId) return;

    dragCounterRef.current[stage] = (dragCounterRef.current[stage] || 0) + 1;
    setDropTarget(stage);

    if (ARCHIVED_STAGES.includes(stage)) {
      setArchivedExpanded(true);
    }
  }

  function handleDragLeave(event, stage) {
    if (!dragCounterRef.current[stage]) return;

    dragCounterRef.current[stage] -= 1;
    if (dragCounterRef.current[stage] <= 0) {
      dragCounterRef.current[stage] = 0;
      setDropTarget((current) => (current === stage ? null : current));
    }
  }

  function handleDrop(event, stage) {
    event.preventDefault();
    const id = event.dataTransfer.getData(DRAG_MIME);
    if (id && onMoveStage) onMoveStage(id, stage);
    handleDragEnd();
  }

  return (
    <div className={`at-board ${draggingId ? 'at-board--dragging' : ''}`}>
      {BOARD_COLUMNS.map((column) => {
        const isArchived = column.key === 'archived';
        const collapsed = isArchived && !archivedExpanded;
        const columnApps = applications.filter((app) =>
          column.stages.includes(app.stage)
        );

        return (
          <section key={column.key} className="at-board__column">
            <header className="at-board__header">
              <h3 className="at-board__title">{column.label}</h3>
              <span className="at-board__count">{columnApps.length}</span>
              {isArchived ? (
                <button
                  type="button"
                  className="at-board__toggle"
                  onClick={() => setArchivedExpanded((prev) => !prev)}
                >
                  {archivedExpanded ? 'Collapse' : 'Expand'}
                </button>
              ) : null}
            </header>

            {!collapsed ? (
              isArchived ? (
                <div className="at-board__archived">
                  {ARCHIVED_STAGES.map((stage) => (
                    <DropZone
                      key={stage}
                      stage={stage}
                      label={stage}
                      compact
                      applications={applications.filter((app) => app.stage === stage)}
                      draggingId={draggingId}
                      dropTarget={dropTarget}
                      onSelect={onSelect}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    />
                  ))}
                </div>
              ) : (
                <DropZone
                  stage={column.stages[0]}
                  applications={columnApps}
                  draggingId={draggingId}
                  dropTarget={dropTarget}
                  onSelect={onSelect}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                />
              )
            ) : (
              <div
                className={`at-board__collapsed ${
                  dropTarget && ARCHIVED_STAGES.includes(dropTarget)
                    ? 'at-board__collapsed--active'
                    : ''
                }`}
                onDragEnter={(event) => {
                  if (!draggingId) return;
                  setArchivedExpanded(true);
                  handleDragEnter(event, 'Rejected');
                }}
                onDragOver={(event) => event.preventDefault()}
              >
                {columnApps.length} archived — expand to view
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}