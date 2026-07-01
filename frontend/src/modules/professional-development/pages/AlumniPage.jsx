import { useMemo, useState } from 'react';
import alumniData from '../../../data/alumni.json';
import './AlumniPage.css';

const ALL = 'All';
const SORT_OPTIONS = {
  name: 'Name (A–Z)',
  gradNewest: 'Grad Year (Newest)',
  gradOldest: 'Grad Year (Oldest)',
};

function compareRecords(a, b, sortBy) {
  if (sortBy === 'gradNewest' || sortBy === 'gradOldest') {
    const yearA = a.gradClass ?? 0;
    const yearB = b.gradClass ?? 0;
    if (yearA !== yearB) {
      return sortBy === 'gradNewest' ? yearB - yearA : yearA - yearB;
    }
  }

  return a.name.localeCompare(b.name);
}

function buildOptions(records, key) {
  const values = new Set();
  records.forEach((record) => {
    if (record[key]) values.add(record[key]);
  });
  return [...values].sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return b - a;
    return String(a).localeCompare(String(b));
  });
}

function matchesSearch(record, query) {
  const haystack = [
    record.name,
    record.location,
    record.industry,
    record.firm,
    record.title,
    ...(record.emails || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

function ContactCell({ emails, linkedin }) {
  return (
    <div className="al-contact">
      {emails?.map((email) => (
        <a key={email} href={`mailto:${email}`} className="al-contact__link">
          {email}
        </a>
      ))}
      {linkedin ? (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="al-contact__link al-contact__link--linkedin"
        >
          LinkedIn
        </a>
      ) : (
        !emails?.length ? <span className="al-contact__empty">—</span> : null
      )}
    </div>
  );
}

export default function AlumniPage() {
  const [search, setSearch] = useState('');
  const [gradClass, setGradClass] = useState(ALL);
  const [industry, setIndustry] = useState(ALL);
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('gradOldest');

  const gradClasses = useMemo(() => buildOptions(alumniData, 'gradClass'), []);
  const industries = useMemo(() => buildOptions(alumniData, 'industry'), []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const locationQuery = locationFilter.trim().toLowerCase();

    return alumniData
      .filter((record) => {
        if (gradClass !== ALL && record.gradClass !== Number(gradClass)) return false;
        if (industry !== ALL && record.industry !== industry) return false;
        if (locationQuery && !record.location?.toLowerCase().includes(locationQuery)) {
          return false;
        }
        if (query && !matchesSearch(record, query)) return false;
        return true;
      })
      .sort((a, b) => compareRecords(a, b, sortBy));
  }, [search, gradClass, industry, locationFilter, sortBy]);

  const hasActiveFilters =
    search.trim() || gradClass !== ALL || industry !== ALL || locationFilter.trim();

  function clearFilters() {
    setSearch('');
    setGradClass(ALL);
    setIndustry(ALL);
    setLocationFilter('');
  }

  return (
    <div className="al">
      <div className="al-controls">
        <h1 className="al-page-title">Alumni Directory</h1>
        <div className="al-controls__inner">
          <label className="al-field al-field--search">
            <span className="al-field__label">Search</span>
            <input
              type="search"
              className="al-field__input"
              placeholder="Name, firm, title, location..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="al-field">
            <span className="al-field__label">Grad Class</span>
            <select
              className="al-field__input"
              value={gradClass}
              onChange={(event) => setGradClass(event.target.value)}
            >
              <option value={ALL}>All</option>
              {gradClasses.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="al-field">
            <span className="al-field__label">Industry</span>
            <select
              className="al-field__input"
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
            >
              <option value={ALL}>All</option>
              {industries.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="al-field">
            <span className="al-field__label">Location</span>
            <input
              type="text"
              className="al-field__input"
              placeholder="City or state..."
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
            />
          </label>

          <label className="al-field">
            <span className="al-field__label">Sort By</span>
            <select
              className="al-field__input"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {hasActiveFilters ? (
            <button type="button" className="al-clear" onClick={clearFilters}>
              Clear Filters
            </button>
          ) : null}
        </div>

        <p className="al-count">
          Showing {filtered.length} of {alumniData.length} alumni
        </p>
      </div>

      <main className="al-main">
        {filtered.length === 0 ? (
          <p className="al-empty">&gt; no alumni match your filters</p>
        ) : (
          <div className="al-table-wrap">
            <table className="al-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Grad Class</th>
                  <th>Location</th>
                  <th>Industry</th>
                  <th>Firm</th>
                  <th>Title</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => (
                  <tr key={record.id}>
                    <td className="al-table__name">{record.name}</td>
                    <td>{record.gradClass ?? '—'}</td>
                    <td>{record.location ?? '—'}</td>
                    <td>{record.industry ?? '—'}</td>
                    <td>{record.firm ?? '—'}</td>
                    <td>{record.title ?? '—'}</td>
                    <td>
                      <ContactCell
                        emails={record.emails}
                        linkedin={record.linkedin}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
