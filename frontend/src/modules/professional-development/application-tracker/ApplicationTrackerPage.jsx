import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AddApplicationForm from './AddApplicationForm.jsx';
import ApplicationDrawer from './ApplicationDrawer.jsx';
import BoardView from './BoardView.jsx';
import TableView from './TableView.jsx';
import { ROLE_TYPES, STAGES } from './stageConfig.js';
import { useApplications } from './useApplications.js';
import './ApplicationTrackerPage.css';

const ALL = 'All';

export default function ApplicationTrackerPage() {
  const { applications, create, update, remove, moveToStage } = useApplications();
  const [view, setView] = useState('board');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [stageFilter, setStageFilter] = useState(ALL);
  const [roleTypeFilter, setRoleTypeFilter] = useState(ALL);

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (stageFilter !== ALL && app.stage !== stageFilter) return false;
      if (roleTypeFilter !== ALL && app.role_type !== roleTypeFilter) return false;
      return true;
    });
  }, [applications, stageFilter, roleTypeFilter]);

  const selectedApplication = applications.find((app) => app.id === selectedId);

  function handleCreate(payload) {
    create(payload);
    setShowAddForm(false);
  }

  function handleSave(id, payload) {
    update(id, payload);
    setSelectedId(null);
  }

  function handleDelete(id) {
    remove(id);
    setSelectedId(null);
  }

  return (
    <div className="at">
      <div className="at-toolbar">
        <div className="at-toolbar__row">
          <div className="at-toolbar__left">
            <Link to="/professional-development" className="at-back">
              ← Professional Development
            </Link>
            <h1 className="at-title">Application Tracker</h1>
          </div>

          <div className="at-toolbar__right">
            <div className="at-view-toggle" role="group" aria-label="View mode">
              <button
                type="button"
                className={`at-view-toggle__btn ${view === 'board' ? 'at-view-toggle__btn--active' : ''}`}
                onClick={() => setView('board')}
              >
                Board
              </button>
              <button
                type="button"
                className={`at-view-toggle__btn ${view === 'table' ? 'at-view-toggle__btn--active' : ''}`}
                onClick={() => setView('table')}
              >
                Table
              </button>
            </div>
            <button
              type="button"
              className="at-btn at-btn--primary"
              onClick={() => setShowAddForm((prev) => !prev)}
            >
              + Add Application
            </button>
          </div>
        </div>

        <div className="at-toolbar__filters">
          <label className="at-filter">
            <span className="at-filter__label">Stage</span>
            <select
              className="at-filter__input"
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
            >
              <option value={ALL}>All</option>
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>

          <label className="at-filter">
            <span className="at-filter__label">Role Type</span>
            <select
              className="at-filter__input"
              value={roleTypeFilter}
              onChange={(event) => setRoleTypeFilter(event.target.value)}
            >
              <option value={ALL}>All</option>
              {ROLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <p className="at-count">
            {filtered.length} of {applications.length} applications
          </p>
        </div>
      </div>

      {showAddForm ? (
        <AddApplicationForm
          onSubmit={handleCreate}
          onCancel={() => setShowAddForm(false)}
        />
      ) : null}

      <main className="at-main">
        {view === 'board' ? (
          <BoardView
            applications={filtered}
            onSelect={setSelectedId}
            onMoveStage={moveToStage}
          />
        ) : (
          <TableView applications={filtered} onSelect={setSelectedId} />
        )}
      </main>

      {selectedApplication ? (
        <ApplicationDrawer
          application={selectedApplication}
          onClose={() => setSelectedId(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ) : null}
    </div>
  );
}
