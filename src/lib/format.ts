import { format, parseISO, formatDistanceToNowStrict, isValid } from 'date-fns';

export function fmtDate(iso: string, pattern = 'EEE d MMM yyyy'): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, pattern) : iso;
}

export function fmtShortDate(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, 'd MMM') : iso;
}

export function fmtTimeAgo(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? formatDistanceToNowStrict(d, { addSuffix: true }) : iso;
}

/** Returns YYYY-MM-DD for a Date in local time. */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return isoDate(new Date());
}

export function fmtMeters(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${Math.round(m)} m`;
}
