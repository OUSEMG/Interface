import { useEffect, useMemo, useState } from 'react';
import { resolveTicker } from './firmDomains.js';
import { isLogoApiConfigured, logoSources } from './logoApi.js';

function monogramLetter(firmName) {
  const trimmed = firmName?.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

export default function FirmLogo({ firmName, firmDomain, size = 36 }) {
  const ticker = resolveTicker(firmName);
  const sources = useMemo(
    () => logoSources({ firmDomain, ticker }, size),
    [firmDomain, ticker, size]
  );
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [firmName, firmDomain, ticker, size]);

  const activeUrl =
    isLogoApiConfigured() && sourceIndex < sources.length
      ? sources[sourceIndex]
      : null;

  if (activeUrl) {
    return (
      <img
        src={activeUrl}
        alt=""
        className="at-logo"
        style={{ width: size, height: size }}
        onError={() => setSourceIndex((prev) => prev + 1)}
      />
    );
  }

  return (
    <span
      className="at-logo at-logo--monogram"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {monogramLetter(firmName)}
    </span>
  );
}
