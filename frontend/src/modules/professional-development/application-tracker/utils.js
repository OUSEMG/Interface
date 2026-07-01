export function daysSince(dateStr) {
  if (!dateStr) return null;
  const target = parseLocalDate(dateStr);
  const today = startOfToday();
  return Math.floor((today - target) / 86400000);
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = parseLocalDate(dateStr);
  const today = startOfToday();
  return Math.floor((target - today) / 86400000);
}

export function formatDateLabel(dateStr) {
  if (!dateStr) return '—';
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeDate(dateStr) {
  if (!dateStr) return null;
  return formatDateLabel(dateStr);
}

export function cardTimingLabel(application) {
  const { stage, applied_date: appliedDate, deadline } = application;

  if (appliedDate) {
    const days = daysSince(appliedDate);
    if (days === 0) return 'Applied today';
    if (days === 1) return 'Applied 1 day ago';
    if (days > 1) return `Applied ${days} days ago`;
    if (days === -1) return 'Applies tomorrow';
    return `Applies in ${Math.abs(days)} days`;
  }

  if (deadline && stage === 'Watching') {
    const days = daysUntil(deadline);
    if (days === 0) return 'Deadline today';
    if (days === 1) return 'Deadline in 1 day';
    if (days > 0) return `Deadline in ${days} days`;
    if (days === -1) return 'Deadline 1 day ago';
    return `Deadline ${Math.abs(days)} days ago`;
  }

  return null;
}

export function formatUpdatedAt(isoStr) {
  if (!isoStr) return '—';
  const date = new Date(isoStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function parseLocalDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`);
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function emptyApplicationFields() {
  return {
    firm_name: '',
    firm_domain: '',
    role: '',
    role_type: 'IB',
    stage: 'Watching',
    applied_date: '',
    deadline: '',
    notes: '',
  };
}

export const DRAG_MIME = 'application/x-ousemg-app-id';
