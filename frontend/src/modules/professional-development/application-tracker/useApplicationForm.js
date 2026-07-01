import { useEffect, useState } from 'react';
import {
  applyFirmSelection,
  firmNameSuggestions,
  resolveDomain,
} from './firmDomains.js';

export function useApplicationForm(initialValues) {
  const [form, setForm] = useState(initialValues);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    setSuggestions(firmNameSuggestions(form.firm_name));
  }, [form.firm_name]);

  function updateField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'firm_name') {
        const domain = resolveDomain(value);
        if (domain) next.firm_domain = domain;
      }
      return next;
    });
  }

  function applySuggestion(name) {
    setForm((prev) => ({ ...prev, ...applyFirmSelection(name) }));
    setSuggestions([]);
  }

  return {
    form,
    suggestions,
    setForm,
    updateField,
    applySuggestion,
  };
}
