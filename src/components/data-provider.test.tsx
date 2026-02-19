import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { DataProvider } from './data-provider';
import { useDashboardStore } from '@/store/use-dashboard-store';

// Track onSnapshot calls for fine-grained control
type SnapshotCall = {
  onNext: (snapshot: any) => void;
  onError: (err: any) => void;
};
let snapshotCalls: SnapshotCall[] = [];

// Mock announce functions
const mockAnnounce = vi.fn();
const mockAnnounceDebounced = vi.fn();

vi.mock('@/lib/announce', () => ({
  announce: (...args: any[]) => mockAnnounce(...args),
  announceDebounced: (...args: any[]) => mockAnnounceDebounced(...args),
}));

vi.mock('@/lib/firebase', () => ({
  getDb: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: any, name: string) => ({ _collection: name })),
  query: vi.fn((...args: any[]) => ({ _query: true, args })),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn((queryOrRef: any, onNext: any, onError?: any) => {
    snapshotCalls.push({ onNext, onError: onError || vi.fn() });
    return vi.fn(); // unsubscribe
  }),
  Timestamp: class Timestamp {
    seconds: number;
    nanoseconds: number;
    constructor(s: number, n: number) { this.seconds = s; this.nanoseconds = n; }
    toDate() { return new Date(this.seconds * 1000); }
  },
}));

function makeSnapshot(docs: Array<{ id: string; data: () => any }>) {
  return { docs };
}

describe('DataProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    snapshotCalls = [];
    mockAnnounce.mockClear();
    mockAnnounceDebounced.mockClear();
    useDashboardStore.setState({
      projects: [],
      runs: [],
      loading: false,
      error: null,
      retryCount: 0,
    });
  });

  it('renders children', () => {
    const { getByText } = render(
      <DataProvider><span>Child</span></DataProvider>
    );
    expect(getByText('Child')).toBeInTheDocument();
  });

  it('loads projects and runs from Firestore', async () => {
    render(<DataProvider><span>Test</span></DataProvider>);

    // Two onSnapshot calls: projects (0) and runs (1)
    expect(snapshotCalls).toHaveLength(2);

    // Deliver projects snapshot
    snapshotCalls[0].onNext(makeSnapshot([
      { id: 'p1', data: () => ({ name: 'Project 1', repo: 'org/repo' }) },
    ]));

    // Deliver runs snapshot
    snapshotCalls[1].onNext(makeSnapshot([
      { id: 'r1', data: () => ({ projectId: 'p1', status: 'passed' }) },
    ]));

    await waitFor(() => {
      const state = useDashboardStore.getState();
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0].id).toBe('p1');
      expect(state.runs).toHaveLength(1);
      expect(state.loading).toBe(false);
    });
  });

  it('sets error on Firestore failure', async () => {
    render(<DataProvider><span>Test</span></DataProvider>);

    // Trigger error on projects listener
    snapshotCalls[0].onError(new Error('Connection failed'));
    // Deliver empty runs to complete loading
    snapshotCalls[1].onNext(makeSnapshot([]));

    await waitFor(() => {
      const state = useDashboardStore.getState();
      expect(state.error).toBe('Connection failed');
    });
  });

  it('falls back to unordered runs query on orderBy failure', async () => {
    render(<DataProvider><span>Test</span></DataProvider>);

    // Deliver empty projects
    snapshotCalls[0].onNext(makeSnapshot([]));

    // Trigger error on runs listener (ordered query fails)
    snapshotCalls[1].onError(new Error('index required'));

    // The error handler should create a new onSnapshot (fallback)
    await waitFor(() => {
      expect(snapshotCalls).toHaveLength(3); // 3rd call is fallback
    });

    // Deliver fallback runs
    snapshotCalls[2].onNext(makeSnapshot([
      { id: 'r1', data: () => ({ projectId: 'p1', status: 'passed' }) },
    ]));

    await waitFor(() => {
      const state = useDashboardStore.getState();
      expect(state.runs).toHaveLength(1);
    });
  });

  it('sanitizes Firestore Timestamps in nested objects and arrays', async () => {
    const { Timestamp } = await import('firebase/firestore');
    const ts = new Timestamp(1700000000, 0);

    render(<DataProvider><span>Test</span></DataProvider>);

    snapshotCalls[0].onNext(makeSnapshot([{
      id: 'p1',
      data: () => ({
        name: 'Project 1',
        createdAt: ts,
        meta: { updatedAt: ts, info: 'plain' },
        tags: [ts, 'smoke', { nestedTs: ts }],
      }),
    }]));
    snapshotCalls[1].onNext(makeSnapshot([]));

    await waitFor(() => {
      const state = useDashboardStore.getState();
      expect(state.projects).toHaveLength(1);
      const p = state.projects[0] as any;
      expect(typeof p.createdAt).toBe('string');
      expect(typeof p.meta.updatedAt).toBe('string');
      expect(p.meta.info).toBe('plain');
      expect(typeof p.tags[0]).toBe('string');
      expect(p.tags[1]).toBe('smoke');
      expect(typeof p.tags[2].nestedTs).toBe('string');
    });
  });

  it('handles non-Error thrown from Firestore', async () => {
    render(<DataProvider><span>Test</span></DataProvider>);

    snapshotCalls[0].onError('string error');
    snapshotCalls[1].onNext(makeSnapshot([]));

    await waitFor(() => {
      const state = useDashboardStore.getState();
      expect(state.error).toBe('Failed to load projects');
    });
  });

  it('sets runs to empty if both queries fail', async () => {
    render(<DataProvider><span>Test</span></DataProvider>);

    snapshotCalls[0].onNext(makeSnapshot([]));
    // First runs listener fails
    snapshotCalls[1].onError(new Error('fail1'));

    // Wait for fallback listener
    await waitFor(() => expect(snapshotCalls).toHaveLength(3));

    // Fallback also fails
    snapshotCalls[2].onError(new Error('fail2'));

    await waitFor(() => {
      const state = useDashboardStore.getState();
      expect(state.runs).toEqual([]);
    });
  });

  describe('Accessibility Announcements', () => {
    it('announces successful initial load with project and run counts', async () => {
      render(<DataProvider><span>Test</span></DataProvider>);

      // Deliver projects
      snapshotCalls[0].onNext(makeSnapshot([
        { id: 'p1', data: () => ({ name: 'Project 1' }) },
        { id: 'p2', data: () => ({ name: 'Project 2' }) },
      ]));

      // Deliver runs
      snapshotCalls[1].onNext(makeSnapshot([
        { id: 'r1', data: () => ({ projectId: 'p1', status: 'passed' }) },
        { id: 'r2', data: () => ({ projectId: 'p2', status: 'failed' }) },
        { id: 'r3', data: () => ({ projectId: 'p1', status: 'skipped' }) },
      ]));

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith('Dashboard loaded. 2 projects, 3 test runs.');
      });
    });

    it('announces successful refresh after retry', async () => {
      // Simulate a retry scenario
      useDashboardStore.setState({ retryCount: 1 });

      render(<DataProvider><span>Test</span></DataProvider>);

      snapshotCalls[0].onNext(makeSnapshot([{ id: 'p1', data: () => ({ name: 'Project 1' }) }]));
      snapshotCalls[1].onNext(makeSnapshot([{ id: 'r1', data: () => ({ projectId: 'p1' }) }]));

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith('Data refreshed successfully');
      });
    });

    it('announces error when initial load fails', async () => {
      render(<DataProvider><span>Test</span></DataProvider>);

      snapshotCalls[0].onError(new Error('Network error'));
      snapshotCalls[1].onNext(makeSnapshot([]));

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith('Error loading data: Network error');
      });
    });

    it('announces update after initial load via debounced announce', async () => {
      render(<DataProvider><span>Test</span></DataProvider>);

      // Initial load
      snapshotCalls[0].onNext(makeSnapshot([{ id: 'p1', data: () => ({ name: 'Project 1' }) }]));
      snapshotCalls[1].onNext(makeSnapshot([{ id: 'r1', data: () => ({ projectId: 'p1' }) }]));

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith('Dashboard loaded. 1 project, 1 test run.');
      });

      mockAnnounce.mockClear();
      mockAnnounceDebounced.mockClear();

      // Subsequent update (new run added)
      snapshotCalls[1].onNext(makeSnapshot([
        { id: 'r1', data: () => ({ projectId: 'p1' }) },
        { id: 'r2', data: () => ({ projectId: 'p1', status: 'failed' }) },
      ]));

      await waitFor(() => {
        expect(mockAnnounceDebounced).toHaveBeenCalledWith('Data updated');
      });

      // Verify regular announce was NOT called for update (only debounced)
      expect(mockAnnounce).not.toHaveBeenCalled();
    });

    it('uses singular form when announcing 1 project and 1 run', async () => {
      render(<DataProvider><span>Test</span></DataProvider>);

      snapshotCalls[0].onNext(makeSnapshot([{ id: 'p1', data: () => ({ name: 'Single' }) }]));
      snapshotCalls[1].onNext(makeSnapshot([{ id: 'r1', data: () => ({ projectId: 'p1' }) }]));

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith('Dashboard loaded. 1 project, 1 test run.');
      });
    });

    it('announces error in projects listener after initial load', async () => {
      render(<DataProvider><span>Test</span></DataProvider>);

      // Initial load succeeds
      snapshotCalls[0].onNext(makeSnapshot([{ id: 'p1', data: () => ({ name: 'Project 1' }) }]));
      snapshotCalls[1].onNext(makeSnapshot([{ id: 'r1', data: () => ({ projectId: 'p1' }) }]));

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith('Dashboard loaded. 1 project, 1 test run.');
      });

      mockAnnounce.mockClear();

      // Now trigger an error
      snapshotCalls[0].onError(new Error('Connection lost'));

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith('Error loading data: Connection lost');
      });
    });
  });
});
