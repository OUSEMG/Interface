let cachedConfig;

function readLogoConfig() {
  if (cachedConfig !== undefined) return cachedConfig;

  const raw = import.meta.env.LOGO_API;
  if (!raw) {
    cachedConfig = null;
    return cachedConfig;
  }

  try {
    const sample = new URL(raw);
    const token = sample.searchParams.get('token');
    if (!token) {
      cachedConfig = null;
      return cachedConfig;
    }

    cachedConfig = {
      host: sample.host,
      token,
    };
  } catch {
    cachedConfig = null;
  }

  return cachedConfig;
}

export function isLogoApiConfigured() {
  return Boolean(readLogoConfig()?.token);
}

export function buildLogoUrl(domain, size = 64) {
  const config = readLogoConfig();
  const normalized = domain?.trim();
  if (!config || !normalized) return null;

  const params = new URLSearchParams({
    token: config.token,
    size: String(size),
    format: 'png',
    theme: 'dark',
  });

  return `https://${config.host}/${encodeURIComponent(normalized)}?${params}`;
}

export function buildTickerLogoUrl(ticker, size = 64) {
  const config = readLogoConfig();
  const normalized = ticker?.trim().toUpperCase();
  if (!config || !normalized) return null;

  const params = new URLSearchParams({
    token: config.token,
    size: String(size),
    format: 'png',
    theme: 'dark',
  });

  return `https://${config.host}/ticker/${encodeURIComponent(normalized)}?${params}`;
}

export function logoSources({ firmDomain, ticker }, size = 64) {
  const sources = [];
  if (firmDomain?.trim()) sources.push(buildLogoUrl(firmDomain, size));
  if (ticker?.trim()) sources.push(buildTickerLogoUrl(ticker, size));
  return sources.filter(Boolean);
}
