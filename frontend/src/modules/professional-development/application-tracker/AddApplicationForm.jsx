import { useState } from 'react';
import ApplicationFormFields from './ApplicationFormFields.jsx';
import { useApplicationForm } from './useApplicationForm.js';
import { emptyApplicationFields } from './utils.js';

export default function AddApplicationForm({ onSubmit, onCancel }) {
  const { form, suggestions, setForm, updateField, applySuggestion } =
    useApplicationForm(emptyApplicationFields());
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.firm_name.trim() || !form.role.trim()) {
      setError('Firm and role are required.');
      return;
    }
    setError('');
    onSubmit(form);
    setForm(emptyApplicationFields());
  }

  return (
    <form className="at-form" onSubmit={handleSubmit}>
      <div className="at-form__header">
        <h2 className="at-form__title">Add Application</h2>
        <button type="button" className="at-form__close" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <ApplicationFormFields
        form={form}
        suggestions={suggestions}
        updateField={updateField}
        applySuggestion={applySuggestion}
        layout="grid"
        required
      />

      {error ? <p className="at-form__error">{error}</p> : null}

      <div className="at-form__actions">
        <button type="submit" className="at-btn at-btn--primary">
          Save Application
        </button>
      </div>
    </form>
  );
}
