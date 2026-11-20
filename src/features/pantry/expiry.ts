export type ExpiryStatus = 'none' | 'expired' | 'soon' | 'ok';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses YYYY-MM-DD as a local date (no timezone surprises). */
export function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(days: number, from: Date = new Date()): string {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  return formatDate(date);
}

export function daysUntil(value: string, today: Date = new Date()): number | null {
  const date = parseDate(value);
  if (!date) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((date.getTime() - start.getTime()) / DAY_MS);
}

export function expiryStatus(
  value: string | null,
  today: Date = new Date(),
  soonDays = 3,
): ExpiryStatus {
  if (!value) return 'none';
  const days = daysUntil(value, today);
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  if (days <= soonDays) return 'soon';
  return 'ok';
}

export function expiryLabel(value: string | null, today: Date = new Date()): string | null {
  if (!value) return null;
  const days = daysUntil(value, today);
  if (days === null) return null;
  if (days < -1) return `Expired ${-days} days ago`;
  if (days === -1) return 'Expired yesterday';
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 14) return `Expires in ${days} days`;
  return `Expires ${value}`;
}
