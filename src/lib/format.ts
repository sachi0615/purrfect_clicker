import i18n from '../i18n';

const formatterCache = new Map<string, Intl.NumberFormat>();

export function fmt(value: number, options: Intl.NumberFormatOptions = {}): string {
  const locale = i18n.language;
  const key = `${locale}-${JSON.stringify(options)}`;

  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 2,
      ...options,
    });
    formatterCache.set(key, formatter);
  }

  return formatter.format(value);
}

export function fmtInteger(value: number): string {
  return fmt(value, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
}
