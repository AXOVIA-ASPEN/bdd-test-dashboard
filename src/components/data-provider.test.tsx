import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { DataProvider } from './data-provider';
import { useDashboardStore } from '@/store/use-dashboard-store';

// Mock firebase
const mockGetDocs = vi.fn();
vi.mock('@/lib/firebase', () => ({
  getDb: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: any, name: string) => name),
  query: vi.fn((...args: any[]) => args),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  Timestamp: class Timestamp {
    seconds: number;
    nanoseconds: number;
    constructor(s: number, n: number) { this.seconds = s; this.nanoseconds = n; }
    toDate() { return new Date(this.seconds * 1000); }
  },
}));

describe('DataProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDashboardStore.setState({
      projects: [],
      runs: [],
      loading: false,
      error: null,
      retryCount: 0,
    });
  });

  it('renders children', () => {
    mockGetDocs.mockResolvedValue({ docs: [] });
    const { getByText } = render(
      <DataProvider><span>Child</span></DataProvider>
    );
    expect(getByText('Child')).toBeInTheDocument();
  });

  it('loads projects and runs from Firestore', async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [{ id: 'p1', data: () => ({ name: 'Project 1', repo: 'org/repo' }) }],
      })
      .mockResolvedValueOnce({
        docs: [{ id: 'r1', data: () => ({ projectId: 'p1', status: 'passed' }) }],
      });

    render(<DataProvider><span>Test</span></DataProvider>);

    await waitFor(() => {
      const state = useDashboardStore.getState();
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0].id).toBe('p1');
      expect(state.runs).toHaveLength(1);
      expect(state.loading).toBe(false);
    });
  });

  it('sets error on Firestore failure', async () => {
    mockGetDocs.mockRejectedValueOnce(new Error('Connection failed'));

    render(<DataProvider><span>Test</span></DataProvider>);

    await waitFor(() => {
      const state = useDashboardStore.getState();
      expect(state.error).toBe('Connection failed');
      expect(state.loading).toBe(false);
    });
  });

  it('falls back to unordered runs query on orderBy failure', async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: [] }) // projects
      .mockRejectedValueOnce(new Error('index required')) // ordered runs
      .mockResolvedValueOnce({ // fallback unordered
        docs: [{ id: 'r1', data: () => ({ projectId: 'p1', status: 'passed' }) }],
      });

    render(<DataProvider><span>Test</span></DataProvider>);

    await waitFor(() => {
      const state = useDashboardStore.getState();
      expect(state.runs).toHaveLength(1);
      expect(state.error).toBeNull();
    });
  });

  it('sets runs to empty if both queries fail', async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: [] }) // projects
      .mockRejectedValueOnce(new Error('fail1')) // ordered
      .mockRejectedValueOnce(new Error('fail2')); // fallback

    render(<DataProvider><span>Test</span></DataProvider>);

    await waitFor(() => {
      const state = useDashboardStore.getState();
      expect(state.runs).toEqual([]);
    });
  });
});
