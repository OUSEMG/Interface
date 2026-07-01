import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'ousemg_applications';

// SWAP POINT — Auth Migration: replace load/save with GET/POST/PUT/DELETE /api/applications
function loadApplications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistApplications(applications) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

function nowIso() {
  return new Date().toISOString();
}

function normalizePayload(payload) {
  return {
    firm_name: payload.firm_name.trim(),
    firm_domain: payload.firm_domain?.trim() || null,
    role: payload.role.trim(),
    role_type: payload.role_type,
    stage: payload.stage,
    applied_date: payload.applied_date || null,
    deadline: payload.deadline || null,
    notes: payload.notes?.trim() || null,
  };
}

export function useApplications() {
  const [applications, setApplications] = useState(loadApplications);

  useEffect(() => {
    persistApplications(applications);
  }, [applications]);

  const create = useCallback((payload) => {
    const timestamp = nowIso();
    const entry = {
      id: crypto.randomUUID(),
      ...normalizePayload(payload),
      created_at: timestamp,
      updated_at: timestamp,
    };
    setApplications((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const update = useCallback((id, payload) => {
    setApplications((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? { ...entry, ...normalizePayload(payload), updated_at: nowIso() }
          : entry
      )
    );
  }, []);

  const remove = useCallback((id) => {
    setApplications((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const moveToStage = useCallback((id, stage) => {
    setApplications((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, stage, updated_at: nowIso() } : entry
      )
    );
  }, []);

  return { applications, create, update, remove, moveToStage };
}

// SWAP POINT — Auth Migration:
// async function fetchApplications() { return fetch('/api/applications').then(r => r.json()); }
// async function createApplication(data) { return fetch('/api/applications', { method: 'POST', ... }); }
// async function updateApplication(id, data) { return fetch(`/api/applications/${id}`, { method: 'PUT', ... }); }
// async function deleteApplication(id) { return fetch(`/api/applications/${id}`, { method: 'DELETE' }); }
