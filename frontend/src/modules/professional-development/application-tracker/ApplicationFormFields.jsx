import { ROLE_TYPES, STAGES } from './stageConfig.js';

export default function ApplicationFormFields({
  form,
  suggestions,
  updateField,
  applySuggestion,
  layout = 'grid',
  required = false,
}) {
  const gridClass = layout === 'grid' ? 'at-form__grid' : 'at-drawer__fields';

  return (
    <div className={gridClass}>
      <label className={`at-field ${layout === 'grid' ? 'at-field--wide' : ''}`}>
        <span className="at-field__label">Firm{required ? ' *' : ''}</span>
        <input
          type="text"
          className="at-field__input"
          value={form.firm_name}
          onChange={(event) => updateField('firm_name', event.target.value)}
          placeholder="Goldman Sachs"
          autoComplete="off"
        />
        {suggestions.length > 0 ? (
          <ul className="at-suggestions">
            {suggestions.map((name) => (
              <li key={name}>
                <button type="button" onClick={() => applySuggestion(name)}>
                  {name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </label>

      <label className="at-field">
        <span className="at-field__label">Domain</span>
        <input
          type="text"
          className="at-field__input"
          value={form.firm_domain}
          onChange={(event) => updateField('firm_domain', event.target.value)}
          placeholder="goldmansachs.com"
        />
      </label>

      <label className={`at-field ${layout === 'grid' ? 'at-field--wide' : ''}`}>
        <span className="at-field__label">Role{required ? ' *' : ''}</span>
        <input
          type="text"
          className="at-field__input"
          value={form.role}
          onChange={(event) => updateField('role', event.target.value)}
          placeholder="Summer Analyst — IBD"
        />
      </label>

      <label className="at-field">
        <span className="at-field__label">Role Type{required ? ' *' : ''}</span>
        <select
          className="at-field__input"
          value={form.role_type}
          onChange={(event) => updateField('role_type', event.target.value)}
        >
          {ROLE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label className="at-field">
        <span className="at-field__label">Stage{required ? ' *' : ''}</span>
        <select
          className="at-field__input"
          value={form.stage}
          onChange={(event) => updateField('stage', event.target.value)}
        >
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </label>

      <label className="at-field">
        <span className="at-field__label">Applied Date</span>
        <input
          type="date"
          className="at-field__input"
          value={form.applied_date}
          onChange={(event) => updateField('applied_date', event.target.value)}
        />
      </label>

      <label className="at-field">
        <span className="at-field__label">Deadline</span>
        <input
          type="date"
          className="at-field__input"
          value={form.deadline}
          onChange={(event) => updateField('deadline', event.target.value)}
        />
      </label>

      <label className={`at-field ${layout === 'grid' ? 'at-field--full' : ''}`}>
        <span className="at-field__label">Notes</span>
        <textarea
          className="at-field__input at-field__textarea"
          rows={layout === 'grid' ? 3 : 4}
          value={form.notes}
          onChange={(event) => updateField('notes', event.target.value)}
          placeholder="Referral, recruiter contact, etc."
        />
      </label>
    </div>
  );
}
