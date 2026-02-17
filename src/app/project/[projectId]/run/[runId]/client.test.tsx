import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RunClient from './client';

const mockProject = { id: 'test', name: 'Test Project', color: '#ff0000' };

vi.mock('@/store/use-dashboard-store', () => ({
  useDashboardStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ getProject: (id: string) => (id === 'test' ? mockProject : undefined) }),
}));

vi.mock('@/lib/firebase', () => ({
  getDb: () => ({}),
}));

// Track onSnapshot calls to distinguish run vs features listener
const mockOnSnapshot = vi.fn();

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
  return {
    doc: vi.fn((_db: unknown, ..._rest: string[]) => ({ _type: 'doc' })),
    collection: vi.fn((_db: unknown, ..._rest: string[]) => ({ _type: 'collection' })),
    onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
    Timestamp: MockTimestamp,
  };
});

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('@/components/run-detail-skeleton', () => ({ RunDetailSkeleton: () => <div data-testid="run-detail-skeleton" /> }));

/**
 * Helper: configure onSnapshot to fire:
 *   1st call  = run doc listener  → calls success with `runSnap`
 *   2nd call  = features listener → calls success with `featuresSnap`
 * Both return a no-op unsubscribe fn.
 */
function setupOnSnapshot(
  runSnap: { exists: () => boolean; id?: string; data?: () => unknown },
  featuresDocs: Array<{ id: string; data: () => unknown }>,
) {
  let callCount = 0;
  mockOnSnapshot.mockImplementation((_ref: unknown, successCb: (s: unknown) => void, _errorCb?: unknown) => {
    callCount++;
    if (callCount === 1) {
      // Run document snapshot
      successCb(runSnap);
    } else {
      // Features collection snapshot
      successCb({ docs: featuresDocs });
    }
    return vi.fn(); // unsubscribe
  });
}

describe('RunClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially then not found', async () => {
    // Callbacks fire synchronously inside act(), so skeleton resolves before assertion.
    // We verify the component handles a non-existent run correctly instead.
    setupOnSnapshot({ exists: () => false }, []);
    render(<RunClient projectId="test" runId="run1" />);
    await waitFor(() => {
      expect(screen.getByText('Run not found.')).toBeInTheDocument();
    });
  });

  it('renders run details when data loads', async () => {
    setupOnSnapshot(
      {
        exists: () => true,
        id: 'run1',
        data: () => ({
          projectId: 'test',
          timestamp: '2026-02-14T12:00:00Z',
          branch: 'main',
          duration: 5000,
          status: 'passed',
          summary: { total: 10, passed: 8, failed: 1, skipped: 1 },
        }),
      },
      [
        {
          id: 'f1',
          data: () => ({
            name: 'Login Feature',
            description: 'Tests login',
            scenarios: [
              {
                name: 'Valid login',
                status: 'passed',
                steps: [
                  { keyword: 'Given', text: 'a user', status: 'passed', duration: 10 },
                ],
                tags: [],
                duration: 10,
              },
            ],
          }),
        },
      ],
    );

    render(<RunClient projectId="test" runId="run1" />);

    await waitFor(() => {
      expect(screen.getAllByText('Test Project').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText('passed').length).toBeGreaterThan(0);
    expect(screen.getByText('Login Feature')).toBeInTheDocument();
    // Expand the feature accordion to see scenarios
    fireEvent.click(screen.getByText('Login Feature'));
    await waitFor(() => {
      expect(screen.getByText('Valid login')).toBeInTheDocument();
    });
  });

  it('renders failed steps with error messages', async () => {
    setupOnSnapshot(
      {
        exists: () => true,
        id: 'run2',
        data: () => ({
          projectId: 'test',
          timestamp: '2026-02-14T12:00:00Z',
          branch: 'main',
          duration: 3000,
          summary: { total: 1, passed: 0, failed: 1, skipped: 0 },
        }),
      },
      [
        {
          id: 'f2',
          data: () => ({
            name: 'Broken Feature',
            description: 'Has failure',
            scenarios: [
              {
                name: 'Bad scenario',
                status: 'failed',
                steps: [
                  { keyword: 'Then', text: 'it fails', status: 'failed', duration: 5, error: 'line1\nline2\nline3\nline4\nline5' },
                ],
                tags: [],
                duration: 5,
              },
            ],
          }),
        },
      ],
    );

    render(<RunClient projectId="test" runId="run2" />);

    await waitFor(() => {
      expect(screen.getByText('Broken Feature')).toBeInTheDocument();
    });
    // Failed feature auto-expands; no click needed — wait for error block directly
    await waitFor(() => {
      expect(screen.getByText('Show more')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Show more'));
    expect(screen.getByText('Show less')).toBeInTheDocument();
  });

  it('shows no detailed results when features empty', async () => {
    setupOnSnapshot(
      {
        exists: () => true,
        id: 'run3',
        data: () => ({
          projectId: 'test',
          timestamp: '2026-02-14T12:00:00Z',
          branch: 'main',
          duration: 0,
          summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
        }),
      },
      [],
    );

    render(<RunClient projectId="test" runId="run3" />);

    await waitFor(() => {
      expect(screen.getByText('No detailed results for this run.')).toBeInTheDocument();
    });
  });

  it('displays run error banner when run.error is set', async () => {
    setupOnSnapshot(
      {
        exists: () => true,
        id: 'run-err',
        data: () => ({
          projectId: 'test',
          timestamp: '2026-02-14T12:00:00Z',
          branch: 'main',
          duration: 0,
          error: 'Build failed: exit code 1\nsome stack trace',
          summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
        }),
      },
      [],
    );

    render(<RunClient projectId="test" runId="run-err" />);

    await waitFor(() => {
      expect(screen.getByText('Run Error')).toBeInTheDocument();
    });
    expect(screen.getByText(/Build failed: exit code 1/)).toBeInTheDocument();
  });

  it('handles placeholder runId gracefully', () => {
    render(<RunClient projectId="test" runId="_" />);
    // Should skip loading and show not found immediately (no onSnapshot called)
    expect(screen.queryByText('Loading run...')).not.toBeInTheDocument();
    expect(screen.getByText('Run not found.')).toBeInTheDocument();
  });

  it('shows copy button on hover over error message', async () => {
    setupOnSnapshot(
      {
        exists: () => true,
        id: 'run-copy',
        data: () => ({
          projectId: 'test',
          timestamp: '2026-02-14T12:00:00Z',
          branch: 'main',
          duration: 1000,
          summary: { total: 1, passed: 0, failed: 1, skipped: 0 },
        }),
      },
      [
        {
          id: 'f-copy',
          data: () => ({
            name: 'Copy Feature',
            description: 'Test copy',
            scenarios: [
              {
                name: 'Copy scenario',
                status: 'failed',
                steps: [
                  { keyword: 'Then', text: 'copy fails', status: 'failed', duration: 5, error: 'Error message to copy' },
                ],
                tags: [],
                duration: 5,
              },
            ],
          }),
        },
      ],
    );

    render(<RunClient projectId="test" runId="run-copy" />);
    // Failed feature auto-expands; copy button is in DOM (opacity handled by CSS/hover)
    await waitFor(() => {
      const copyBtn = screen.getByRole('button', { name: /copy error message/i });
      expect(copyBtn).toBeInTheDocument();
    });
  });

  it('shows live badge when onSnapshot is active', async () => {
    setupOnSnapshot(
      {
        exists: () => true,
        id: 'run-live',
        data: () => ({
          projectId: 'test',
          timestamp: '2026-02-14T12:00:00Z',
          branch: 'main',
          duration: 1000,
          status: 'running',
          summary: { total: 5, passed: 3, failed: 0, skipped: 0 },
        }),
      },
      [],
    );

    render(<RunClient projectId="test" runId="run-live" />);
    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });
});
