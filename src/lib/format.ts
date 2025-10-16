const SUFFIXES = [
  { value: 1e12, label: 'T' },
  { value: 1e9, label: 'B' },
  { value: 1e6, label: 'M' },
  { value: 1e3, label: 'K' },
];

export function fmt(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  if (abs < 1) {
    return `${value.toFixed(2)}`;
  }

  for (const suffix of SUFFIXES) {
    if (abs >= suffix.value) {
      return `${sign}${(abs / suffix.value).toFixed(2)}${suffix.label}`;
    }
  }

  if (abs >= 100) {
    return `${sign}${abs.toFixed(0)}`;
  }

  if (abs >= 10) {
    return `${sign}${abs.toFixed(1)}`;
  }

  return `${sign}${abs.toFixed(2)}`;
}
