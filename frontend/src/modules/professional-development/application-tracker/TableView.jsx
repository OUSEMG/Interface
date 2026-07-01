import { useMemo, useState } from 'react';
import FirmLogo from './FirmLogo.jsx';
import { stageColorClass } from './stageConfig.js';
import { formatDateLabel, formatUpdatedAt } from './utils.js';

const COLUMNS = [
  { key: 'firm_name', label: 'Firm' },
  { key: 'role', label: 'Role' },
  { key: 'role_type', label: 'Type' },
  { key: 'stage', label: 'Stage' },
  { key: 'applied_date', label: 'Applied' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'updated_at', label: 'Updated' },
];

function compareValues(a, b, key) {
  const left = a[key] ?? '';
  const right = b[key] ?? '';
  if (key === 'applied_date' || key === 'deadline' || key === 'updated_at') {
    return String(left).localeCompare(String(right));
  }
  return String(left).localeCompare(String(right), undefined, { sensitivity: 'base' });
}

export default function TableView({ applications, onSelect }) {
  const [sortKey, setSortKey] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    const copy = [...applications];
    copy.sort((a, b) => {
      const result = compareValues(a, b, sortKey);
      return sortDir === 'asc' ? result : -result;
    });
    return copy;
  }, [applications, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  }

  return (
    <div className="at-table-wrap">
      <table className="at-table">
        <thead>
          <tr>
            <th scope="col" aria-label="Logo" />
            {COLUMNS.map(({ key, label }) => (
              <th key={key} scope="col">
                <button
                  type="button"
                  className="at-table__sort"
                  onClick={() => toggleSort(key)}
                >
                  {label}
                  {sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length + 1} className="at-table__empty">
                No applications yet
              </td>
            </tr>
          ) : (
            sorted.map((application) => (
              <tr
                key={application.id}
                className="at-table__row"
                onClick={() => onSelect(application.id)}
              >
                <td>
                  <FirmLogo
                    firmName={application.firm_name}
                    firmDomain={application.firm_domain}
                    size={28}
                  />
                </td>
                <td>{application.firm_name}</td>
                <td>{application.role}</td>
                <td>
                  <span className="at-badge">{application.role_type}</span>
                </td>
                <td>
                  <span className={`at-stage ${stageColorClass(application.stage)}`}>
                    {application.stage}
                  </span>
                </td>
                <td>{formatDateLabel(application.applied_date)}</td>
                <td>{formatDateLabel(application.deadline)}</td>
                <td>{formatUpdatedAt(application.updated_at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
