import { useEffect, useState } from 'react';
import ApplicationFormFields from './ApplicationFormFields.jsx';
import FirmLogo from './FirmLogo.jsx';
import { useApplicationForm } from './useApplicationForm.js';

function toFormState(application) {
  return {
    firm_name: application.firm_name || '',
    firm_domain: application.firm_domain || '',
    role: application.role || '',
    role_type: application.role_type || 'IB',
    stage: application.stage || 'Watching',
    applied_date: application.applied_date || '',
    deadline: application.deadline || '',
    notes: application.notes || '',
  };
}

export default function ApplicationDrawer({
  application,
  onClose,
  onSave,
  onDelete,
}) {
  const { form, suggestions, setForm, updateField, applySuggestion } =
    useApplicationForm(toFormState(application));
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setForm(toFormState(application));
    setConfirmDelete(false);
  }, [application]);

  function handleSave(event) {
    event.preventDefault();
    if (!form.firm_name.trim() || !form.role.trim()) return;
    onSave(application.id, form);
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(application.id);
  }

  return (
    <>
      <button
        type="button"
        className="at-drawer__backdrop"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside className="at-drawer" aria-label="Application details">
        <header className="at-drawer__header">
          <div className="at-drawer__identity">
            <FirmLogo
              firmName={form.firm_name}
              firmDomain={form.firm_domain}
              size={40}
            />
            <div>
              <h2 className="at-drawer__title">{form.firm_name || 'Application'}</h2>
              <p className="at-drawer__subtitle">{form.role || 'Role'}</p>
            </div>
          </div>
          <button type="button" className="at-drawer__close" onClick={onClose}>
            ×
          </button>
        </header>

        <form className="at-drawer__form" onSubmit={handleSave}>
          <ApplicationFormFields
            form={form}
            suggestions={suggestions}
            updateField={updateField}
            applySuggestion={applySuggestion}
            layout="drawer"
          />

          <div className="at-drawer__actions">
            <button type="submit" className="at-btn at-btn--primary">
              Save
            </button>
            <button
              type="button"
              className={`at-btn ${confirmDelete ? 'at-btn--danger' : 'at-btn--ghost'}`}
              onClick={handleDelete}
            >
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
