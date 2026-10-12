/** "800000" kobo → "₦8,000". */
export function naira(kobo: string | number | bigint, opts: { decimals?: boolean } = {}) {
  const value = Number(kobo) / 100;
  return `₦${value.toLocaleString('en-NG', {
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : 0,
  })}`;
}

export const percent = (fraction: number) => `${Math.round(fraction * 100)}%`;

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const initials = (first: string, last = '') => `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
