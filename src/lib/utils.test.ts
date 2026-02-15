import { describe, it, expect, vi } from 'vitest';
import { cn, formatDuration, formatRelativeTime, formatDate, formatTime, statusColor, statusBg } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });
  it('handles tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'end')).toBe('base end');
  });
});

describe('formatDuration', () => {
  it('formats milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
  });
  it('formats seconds', () => {
    expect(formatDuration(2500)).toBe('2.5s');
  });
  it('formats minutes and seconds', () => {
    expect(formatDuration(125000)).toBe('2m 5s');
  });
  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0ms');
  });
  it('handles exactly 1 second', () => {
    expect(formatDuration(1000)).toBe('1.0s');
  });
  it('handles exactly 60 seconds', () => {
    expect(formatDuration(60000)).toBe('1m 0s');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for < 60 seconds ago', () => {
    const now = new Date();
    expect(formatRelativeTime(now.toISOString())).toBe('just now');
  });
  it('returns minutes ago', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(d.toISOString())).toBe('5m ago');
  });
  it('returns hours ago', () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(d.toISOString())).toBe('3h ago');
  });
  it('returns days ago', () => {
    const d = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(d.toISOString())).toBe('5d ago');
  });
  it('returns formatted date for 30+ days', () => {
    const d = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(d.toISOString());
    // Should fall through to formatDate
    expect(result).toMatch(/\w+ \d+, \d{4}/);
  });
});

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2026-02-14T12:00:00Z');
    expect(result).toContain('Feb');
    expect(result).toContain('14');
    expect(result).toContain('2026');
  });
});

describe('formatTime', () => {
  it('formats ISO time string', () => {
    const result = formatTime('2026-02-14T15:30:00Z');
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe('statusColor', () => {
  it('returns emerald for passed', () => {
    expect(statusColor('passed')).toContain('emerald');
  });
  it('returns red for failed', () => {
    expect(statusColor('failed')).toContain('red');
  });
  it('returns yellow for skipped', () => {
    expect(statusColor('skipped')).toContain('yellow');
  });
  it('returns slate for unknown', () => {
    expect(statusColor('unknown')).toContain('slate');
  });
});

describe('statusBg', () => {
  it('returns correct classes for passed', () => {
    expect(statusBg('passed')).toContain('emerald');
  });
  it('returns correct classes for failed', () => {
    expect(statusBg('failed')).toContain('red');
  });
  it('returns correct classes for skipped', () => {
    expect(statusBg('skipped')).toContain('yellow');
  });
  it('returns correct classes for pending', () => {
    expect(statusBg('pending')).toContain('blue');
  });
  it('returns correct classes for running', () => {
    expect(statusBg('running')).toContain('blue');
  });
  it('returns slate for unknown status', () => {
    expect(statusBg('other')).toContain('slate');
  });
});
