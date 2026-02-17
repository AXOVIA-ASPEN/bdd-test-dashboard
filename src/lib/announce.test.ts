import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { announce, announceDebounced } from './announce';

describe('announce', () => {
  let el: HTMLDivElement;

  beforeEach(() => {
    el = document.createElement('div');
    el.id = 'announcer';
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it('clears then sets textContent via rAF', async () => {
    el.textContent = 'old';
    announce('hello');
    // Immediately after, textContent is cleared
    expect(el.textContent).toBe('');

    // After rAF fires, message is set
    await new Promise(r => requestAnimationFrame(r));
    expect(el.textContent).toBe('hello');
  });

  it('does nothing when element is missing', () => {
    el.remove();
    // Should not throw
    announce('test');
  });

  it('does nothing on server (no document)', () => {
    const origDoc = globalThis.document;
    // @ts-ignore
    delete globalThis.document;
    try {
      announce('test'); // should not throw
    } finally {
      globalThis.document = origDoc;
    }
  });
});

describe('announceDebounced', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const el = document.createElement('div');
    el.id = 'announcer';
    document.body.appendChild(el);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.getElementById('announcer')?.remove();
  });

  it('debounces rapid calls', () => {
    // Mock rAF to execute synchronously so fake timers work end-to-end
    const rafSpy = vi.spyOn(global, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    announceDebounced('first', 500);
    announceDebounced('second', 500);
    announceDebounced('third', 500);

    vi.advanceTimersByTime(500);

    const el = document.getElementById('announcer')!;
    expect(el.textContent).toBe('third');

    rafSpy.mockRestore();
  });

  it('uses default 1000ms delay', () => {
    announceDebounced('msg');
    vi.advanceTimersByTime(999);
    const el = document.getElementById('announcer')!;
    // Not yet fired
    expect(el.textContent).toBe('');

    vi.advanceTimersByTime(1);
    // Now the timeout fires, clears content, rAF pending
    expect(el.textContent).toBe('');
  });
});
