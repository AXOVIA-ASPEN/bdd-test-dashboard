import { describe, it, expect, vi } from 'vitest';

vi.mock('firebase/firestore', () => {
  class MockTimestamp {
    seconds: number;
    nanoseconds: number;
    constructor(seconds: number, nanoseconds: number) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
    toDate() { return new Date(this.seconds * 1000); }
  }
  return { Timestamp: MockTimestamp };
});

import { sanitizeTimestamps } from './firestore-utils';
import { Timestamp } from 'firebase/firestore';

function ts(seconds: number) {
  return new (Timestamp as unknown as new (s: number, n: number) => InstanceType<typeof Timestamp>)(seconds, 0);
}

describe('sanitizeTimestamps', () => {
  it('passes plain values through unchanged', () => {
    expect(sanitizeTimestamps({ name: 'test', count: 42 })).toEqual({ name: 'test', count: 42 });
  });

  it('converts Timestamp to ISO string', () => {
    const result = sanitizeTimestamps({ createdAt: ts(1700000000) });
    expect(result.createdAt).toBe('2023-11-14T22:13:20.000Z');
  });

  it('handles nested objects with Timestamps', () => {
    const result = sanitizeTimestamps({ meta: { updatedAt: ts(1700000000), label: 'foo' } });
    expect(result).toEqual({ meta: { updatedAt: '2023-11-14T22:13:20.000Z', label: 'foo' } });
  });

  it('handles arrays with Timestamps', () => {
    const result = sanitizeTimestamps({ times: [ts(1700000000), 'plain', 123] });
    expect(result.times).toEqual(['2023-11-14T22:13:20.000Z', 'plain', 123]);
  });

  it('handles arrays with nested objects containing Timestamps', () => {
    const result = sanitizeTimestamps({ items: [{ date: ts(1700000000), name: 'a' }] });
    expect(result.items).toEqual([{ date: '2023-11-14T22:13:20.000Z', name: 'a' }]);
  });

  it('handles null and undefined values', () => {
    expect(sanitizeTimestamps({ a: null, b: undefined })).toEqual({ a: null, b: undefined });
  });
});
