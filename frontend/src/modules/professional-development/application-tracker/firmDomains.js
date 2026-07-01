import { FIRMS } from './firmDirectory.js';

const SUGGESTION_LIMIT = 12;

function findFirmKey(firmName) {
  if (!firmName?.trim()) return null;

  const trimmed = firmName.trim();
  if (FIRMS[trimmed]) return trimmed;

  const exactIgnoreCase = Object.keys(FIRMS).find(
    (name) => name.toLowerCase() === trimmed.toLowerCase()
  );
  if (exactIgnoreCase) return exactIgnoreCase;

  const aliasMatch = Object.entries(FIRMS).find(([, meta]) =>
    meta.aliases?.some((alias) => alias.toLowerCase() === trimmed.toLowerCase())
  );
  return aliasMatch?.[0] ?? null;
}

function scoreFirm(name, meta, query) {
  const lowerName = name.toLowerCase();
  const words = lowerName.split(/\s+/);

  if (lowerName === query) return 0;
  if (lowerName.startsWith(query)) return 1;
  if (words.some((word) => word.startsWith(query))) return 2;
  if (meta.ticker?.toLowerCase().startsWith(query)) return 2;
  if (meta.aliases?.some((alias) => alias.startsWith(query))) return 2;
  if (lowerName.includes(query)) return 3;
  if (meta.aliases?.some((alias) => alias.includes(query))) return 4;
  return null;
}

export function resolveFirmLookup(firmName) {
  const key = findFirmKey(firmName);
  return key ? FIRMS[key] : null;
}

export function resolveDomain(firmName) {
  return resolveFirmLookup(firmName)?.domain ?? '';
}

export function resolveTicker(firmName) {
  return resolveFirmLookup(firmName)?.ticker ?? '';
}

export function firmNameSuggestions(query, limit = SUGGESTION_LIMIT) {
  if (!query?.trim()) return [];

  const normalized = query.trim().toLowerCase();

  return Object.entries(FIRMS)
    .map(([name, meta]) => {
      const score = scoreFirm(name, meta, normalized);
      return score === null ? null : { name, score };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ name }) => name);
}

export function applyFirmSelection(firmName) {
  const lookup = resolveFirmLookup(firmName);
  return {
    firm_name: firmName,
    firm_domain: lookup?.domain ?? '',
  };
}

export { FIRMS };
