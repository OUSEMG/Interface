import { apiFetch } from '../../../utils/api.js';

const PORTFOLIOS = [
  { key: 'combined', label: 'Combined' },
  { key: 'traditional', label: 'Traditional' },
  { key: 'sustainable', label: 'Sustainable' },
];

export { PORTFOLIOS };

export async function fetchPortfolioSnapshot(portfolio, { forceRefresh = false } = {}) {
  const params = new URLSearchParams();
  if (forceRefresh) params.set('force_refresh', 'true');

  const path =
    portfolio === 'combined'
      ? '/api/portfolio/combined/snapshot'
      : `/api/portfolio/${portfolio}/snapshot`;
  const url = params.toString() ? `${path}?${params}` : path;
  const response = await apiFetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Could not fetch prices. Showing last known data.');
  }

  return response.json();
}
