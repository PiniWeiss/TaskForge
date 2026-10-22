// Timestamp formatting. Relative for scanning, absolute (on hover / in the detail panel) for precision.

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const monthDay = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
const monthDayYear = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const absolute = new Intl.DateTimeFormat('en', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function plural(n: number, unit: string): string {
  return `${String(n)} ${unit}${n === 1 ? '' : 's'} ago`;
}

/**
 * "just now", then minutes, hours and days for the last week, then a date.
 * `short` is for dense columns ("5m", "3h", "2d"); `long` reads as a sentence ("5 minutes ago").
 */
export function formatRelative(iso: string, now: Date, style: 'short' | 'long' = 'short'): string {
  const date = new Date(iso);
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));

  if (seconds < 45) return 'just now';
  if (seconds < HOUR) {
    const n = Math.max(1, Math.round(seconds / MINUTE));
    return style === 'short' ? `${String(n)}m` : plural(n, 'minute');
  }
  if (seconds < DAY) {
    const n = Math.round(seconds / HOUR);
    return style === 'short' ? `${String(n)}h` : plural(n, 'hour');
  }
  if (seconds < 7 * DAY) {
    const n = Math.round(seconds / DAY);
    return style === 'short' ? `${String(n)}d` : plural(n, 'day');
  }
  return date.getFullYear() === now.getFullYear()
    ? monthDay.format(date)
    : monthDayYear.format(date);
}

/** "Fri, Oct 23, 2026, 14:05" in the viewer's time zone. */
export function formatAbsolute(iso: string): string {
  return absolute.format(new Date(iso));
}
