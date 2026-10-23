import { describe, expect, it } from 'vitest';
import { formatAbsolute, formatRelative } from '../../src/lib/time.ts';

const now = new Date('2026-10-23T12:00:00Z');

function ago(seconds: number): string {
  return new Date(now.getTime() - seconds * 1000).toISOString();
}

describe('formatRelative', () => {
  it('says "just now" for the last 45 seconds, including clock skew into the future', () => {
    expect(formatRelative(ago(10), now)).toBe('just now');
    expect(formatRelative(ago(-30), now)).toBe('just now');
  });

  it('uses compact units in short style', () => {
    expect(formatRelative(ago(5 * 60), now)).toBe('5m');
    expect(formatRelative(ago(3 * 3600), now)).toBe('3h');
    expect(formatRelative(ago(2 * 86400), now)).toBe('2d');
  });

  it('reads as a sentence in long style, with singular units', () => {
    expect(formatRelative(ago(60), now, 'long')).toBe('1 minute ago');
    expect(formatRelative(ago(2 * 3600), now, 'long')).toBe('2 hours ago');
    expect(formatRelative(ago(86400), now, 'long')).toBe('1 day ago');
  });

  it('switches to a date after a week, adding the year only when it differs', () => {
    expect(formatRelative('2026-10-03T12:00:00Z', now)).toBe('Oct 3');
    expect(formatRelative('2025-03-04T12:00:00Z', now)).toBe('Mar 4, 2025');
  });
});

describe('formatAbsolute', () => {
  it('includes weekday, date and 24-hour time', () => {
    expect(formatAbsolute('2026-10-23T12:00:00Z')).toMatch(/^Fri, Oct 23, 2026, \d{2}:\d{2}$/);
  });
});
