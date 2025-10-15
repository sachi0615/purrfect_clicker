export function fmt(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1e12) {
    return `${sign}${(abs / 1e12).toFixed(2)}T`;
  }
  if (abs >= 1e9) {
    return `${sign}${(abs / 1e9).toFixed(2)}B`;
  }
  if (abs >= 1e6) {
    return `${sign}${(abs / 1e6).toFixed(2)}M`;
  }
  if (abs >= 1e3) {
    return `${sign}${(abs / 1e3).toFixed(2)}K`;
  }
  if (abs === 0) {
    return '0';
  }

  if (abs >= 100) {
    return `${sign}${abs.toFixed(0)}`;
  }
  if (abs >= 10) {
    return `${sign}${abs.toFixed(1)}`;
  }
  return `${sign}${abs.toFixed(2)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function now(): number {
  return Date.now();
}
