import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RunClient from './client';

const mockProject = { id: 'test', name: 'Test Project', color: '#ff0000' };
const mockRuns = [
  { id: 'run1', projectId: 'test', timestamp: '2026-02-14T10:00:00Z', branch: 'main', duration: 1000, summary: { total: 5, passed: 5, failed: 0, skipped: 0 } },
  { id: 'run2', projectId: 'test', timestamp: '2026-02-14T11:00:00Z', branch: 'main', duration: 2000, summary: { total: 5, passed: 4, failed: 1, skipped: 0 } },
  { id: 'run3', projectId: 'test', timestamp: '2026-02-14T12:00:00Z', branch: 'main', duration: 3000, summary: { total: 5, passed: 5, failed: 0, skipped: 0 } },
];

const mockPush = vi.fn();
const mockRouter = { push: mockPush };

vi.mock('@/store/use-dashboard-store', () => ({
  useDashboardStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      getProject: (id: string) => (id === 'test' ? mockProject : undefined),
      runs: mockRuns,
    }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/project/test/run/run2',
}));

vi.mock('@/lib/firebase', () => ({ getDb: () => ({}) }));

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
    doc: vi.fn(() => ({ _type: 'doc' })),
    collection: vi.fn(() => ({ _type: 'collection' })),
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

vi.mock('@/hooks/use-keyboard-shortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

function setupOnSnapshot(
  runSnap: { exists: () => boolean; id?: string; data?: () => unknown },
  featuresDocs: Array<{ id: string; data: () => unknown }>,
) {
  let callCount = 0;
  mockOnSnapshot.mockImplementation((_ref: unknown, successCb: (s: unknown) => void, _errorCb?: unknown) => {
    callCount++;
    if (callCount === 1) {
      successCb(runSnap);
    } else {
      successCb({ docs: featuresDocs });
    }
    return vi.fn();
  });
}

describe('RunClient - Additional Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it('handles clipboard copy failure gracefully', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock clipboard.writeText to reject
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard access denied')),
      },
    });

    setupOnSnapshot(
      {
        exists: () => true,
        id: 'run-fail-copy',
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
          id: 'f-fail',
          data: () => ({
            name: 'Fail Feature',
            scenarios: [
              {
                name: 'Fail scenario',
                status: 'failed',
                steps: [
                  { keyword: 'Then', text: 'fails', status: 'failed', duration: 5, error: 'Test error' },
                ],
                tags: [],
                duration: 5,
              },
            ],
          }),
        },
      ],
    );

    render(<RunClient projectId="test" runId="run-fail-copy" />);

    await waitFor(() => {
      const copyBtn = screen.getByRole('button', { name: /copy error message/i });
      expect(copyBtn).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole('button', { name: /copy error message/i });
    fireEvent.click(copyBtn);

    // Wait for the error to be logged
    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith('Copy failed:', expect.any(Error));
    });

    consoleWarnSpy.mockRestore();
  });

  it('filters scenarios by status - failed', async () => {
    setupOnSnapshot(
      {
        exists: () => true,
        id: 'run-filter',
        data: () => ({
          projectId: 'test',
          timestamp: '2026-02-14T12:00:00Z',
          branch: 'main',
          duration: 5000,
          summary: { total: 3, passed: 1, failed: 1, skipped: 1 },
        }),
      },
      [
        {
          id: 'f-mixed',
          data: () => ({
            name: 'Mixed Feature',
            scenarios: [
              {
                name: 'Passed scenario',
                status: 'passed',
                steps: [{ keyword: 'Given', text: 'pass', status: 'passed', duration: 10 }],
                tags: [],
                duration: 10,
              },
              {
                name: 'Failed scenario',
                status: 'failed',
                steps: [{ keyword: 'Then', text: 'fail', status: 'failed', duration: 5, error: 'Error' }],
                tags: [],
                duration: 5,
              },
              {
                name: 'Skipped scenario',
                status: 'skipped',
                steps: [{ keyword: 'When', text: 'skip', status: 'skipped', duration: 0 }],
                tags: [],
                duration: 0,
              },
            ],
          }),
        },
      ],
    );

    render(<RunClient projectId="test" runId="run-filter" />);

    await waitFor(() => {
      expect(screen.getByText('Mixed Feature')).toBeInTheDocument();
    });

    // Click "Failed" filter
    const failedFilter = screen.getByTestId('scenario-filter-failed');
    fireEvent.click(failedFilter);

    await waitFor(() => {
      // Expand the feature to see scenarios
      const featureHeader = screen.getByText('Mixed Feature');
      fireEvent.click(featureHeader);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed scenario')).toBeInTheDocument();
    });
  });

  it('filters scenarios by status - skipped', async () => {
    setupOnSnapshot(
      {
        exists: () => true,
        id: 'run-skip-filter',
        data: () => ({
          projectId: 'test',
          timestamp: '2026-02-14T12:00:00Z',
          branch: 'main',
          duration: 5000,
          summary: { total: 2, passed: 1, failed: 0, skipped: 1 },
        }),
      },
      [
        {
          id: 'f-skip',
          data: () => ({
            name: 'Skip Feature',
            scenarios: [
              {
                name: 'Passed scenario',
                status: 'passed',
                steps: [{ keyword: 'Given', text: 'pass', status: 'passed', duration: 10 }],
                tags: [],
                duration: 10,
              },
              {
                name: 'Skipped scenario',
                status: 'skipped',
                steps: [{ keyword: 'When', text: 'skip', status: 'skipped', duration: 0 }],
                tags: [],
                duration: 0,
              },
            ],
          }),
        },
      ],
    );

    render(<RunClient projectId="test" runId="run-skip-filter" />);

    await waitFor(() => {
      expect(screen.getByText('Skip Feature')).toBeInTheDocument();
    });

    // Click "Skipped" filter
    const skippedFilter = screen.getByTestId('scenario-filter-skipped');
    fireEvent.click(skippedFilter);

    await waitFor(() => {
      const featureHeader = screen.getByText('Skip Feature');
      fireEvent.click(featureHeader);
    });

    await waitFor(() => {
      expect(screen.getByText('Skipped scenario')).toBeInTheDocument();
    });
  });

  it('filters scenarios by status - passed', async () => {
    setupOnSnapshot(
      {
        exists: () => true,
        id: 'run-pass-filter',
        data: () => ({
          projectId: 'test',
          timestamp: '2026-02-14T12:00:00Z',
          branch: 'main',
          duration: 5000,
          summary: { total: 2, passed: 1, failed: 1, skipped: 0 },
        }),
      },
      [
        {
          id: 'f-pass',
          data: () => ({
            name: 'Pass Feature',
            scenarios: [
              {
                name: 'Passed scenario',
                status: 'passed',
                steps: [{ keyword: 'Given', text: 'pass', status: 'passed', duration: 10 }],
                tags: [],
                duration: 10,
              },
              {
                name: 'Failed scenario',
                status: 'failed',
                steps: [{ keyword: 'Then', text: 'fail', status: 'failed', duration: 5, error: 'Error' }],
                tags: [],
                duration: 5,
              },
            ],
          }),
        },
      ],
    );

    render(<RunClient projectId="test" runId="run-pass-filter" />);

    await waitFor(() => {
      expect(screen.getByText('Pass Feature')).toBeInTheDocument();
    });

    // Click "Passed" filter
    const passedFilter = screen.getByTestId('scenario-filter-passed');
    fireEvent.click(passedFilter);

    await waitFor(() => {
      const featureHeader = screen.getByText('Pass Feature');
      fireEvent.click(featureHeader);
    });

    await waitFor(() => {
      expect(screen.getByText('Passed scenario')).toBeInTheDocument();
    });
  });

  it('toggles all features expanded/collapsed', async () => {
    setupOnSnapshot(
      {
        exists: () => true,
        id: 'run-toggle-all',
        data: () => ({
          projectId: 'test',
          timestamp: '2026-02-14T12:00:00Z',
          branch: 'main',
          duration: 5000,
          summary: { total: 2, passed: 2, failed: 0, skipped: 0 },
        }),
      },
      [
        {
          id: 'f1',
          data: () => ({
            name: 'Feature 1',
            scenarios: [
              {
                name: 'Scenario 1',
                status: 'passed',
                steps: [{ keyword: 'Given', text: 'step1', status: 'passed', duration: 10 }],
                tags: [],
                duration: 10,
              },
            ],
          }),
        },
        {
          id: 'f2',
          data: () => ({
            name: 'Feature 2',
            scenarios: [
              {
                name: 'Scenario 2',
                status: 'passed',
                steps: [{ keyword: 'Given', text: 'step2', status: 'passed', duration: 10 }],
                tags: [],
                duration: 10,
              },
            ],
          }),
        },
      ],
    );

    render(<RunClient projectId="test" runId="run-toggle-all" />);

    await waitFor(() => {
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 2')).toBeInTheDocument();
    });

    // Features start collapsed (no failures to auto-expand)
    const expandAllBtn = screen.getByText('Expand All');
    fireEvent.click(expandAllBtn);

    await waitFor(() => {
      expect(screen.getByText('Collapse All')).toBeInTheDocument();
    });

    // Click again to collapse
    const collapseAllBtn = screen.getByText('Collapse All');
    fireEvent.click(collapseAllBtn);

    await waitFor(() => {
      expect(screen.getByText('Expand All')).toBeInTheDocument();
    });
  });

  it('copies share link to clipboard', async () => {
    const mockClipboard = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockClipboard,
      },
    });

    setupOnSnapshot(
      {
        exists: () => true,
        id: 'run-share',
        data: () => ({
          projectId: 'test',
          timestamp: '2026-02-14T12:00:00Z',
          branch: 'main',
          duration: 1000,
          summary: { total: 1, passed: 1, failed: 0, skipped: 0 },
        }),
      },
      [],
    );

    render(<RunClient projectId="test" runId="run-share" />);

    await waitFor(() => {
      const shareBtn = screen.getByRole('button', { name: /share run/i });
      expect(shareBtn).toBeInTheDocument();
    });

    const shareBtn = screen.getByRole('button', { name: /share run/i });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(mockClipboard).toHaveBeenCalled();
    });
  });

  it('navigates to previous run', async () => {
    setupOnSnapshot(
      {
        exists: () => true,
        id: 'run2',
        data: () => ({
          projectId: 'test',
          timestamp: '2026-02-14T11:00:00Z',
          branch: 'main',
          duration: 2000,
          summary: { total: 5, passed: 4, failed: 1, skipped: 0 },
        }),
      },
      [],
    );

    render(<RunClient projectId="test" runId="run2" />);

    await waitFor(() => {
      const prevBtn = screen.getByRole('button', { name: /previous run/i });
      expect(prevBtn).toBeInTheDocument();
    });

    const prevBtn = screen.getByRole('button', { name: /previous run/i });
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('run1'));
    });
  });

  it('navigates to next run', async () => {
    setupOnSnapshot(
      {
        exists: () => true,
        id: 'run2',
        data: () => ({
          projectId: 'test',
          timestamp: '2026-02-14T11:00:00Z',
          branch: 'main',
          duration: 2000,
          summary: { total: 5, passed: 4, failed: 1, skipped: 0 },
        }),
      },
      [],
    );

    render(<RunClient projectId="test" runId="run2" />);

    await waitFor(() => {
      const nextBtn = screen.getByRole('button', { name: /next run/i });
      expect(nextBtn).toBeInTheDocument();
    });

    const nextBtn = screen.getByRole('button', { name: /next run/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('run3'));
    });
  });

  it('handles scenario with multiple failed steps', async () => {
    setupOnSnapshot(
      {
        exists: () => true,
        id: 'run-multi-fail',
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
          id: 'f-multi',
          data: () => ({
            name: 'Multi Fail Feature',
            scenarios: [
              {
                name: 'Multi fail scenario',
                status: 'failed',
                steps: [
                  { keyword: 'Given', text: 'step 1', status: 'passed', duration: 10 },
                  { keyword: 'When', text: 'step 2', status: 'failed', duration: 5, error: 'Error 1' },
                  { keyword: 'Then', text: 'step 3', status: 'failed', duration: 5, error: 'Error 2' },
                ],
                tags: [],
                duration: 20,
              },
            ],
          }),
        },
      ],
    );

    render(<RunClient projectId="test" runId="run-multi-fail" />);

    await waitFor(() => {
      expect(screen.getByText('Multi Fail Feature')).toBeInTheDocument();
    });

    // Failed feature auto-expands
    await waitFor(() => {
      expect(screen.getByText('Multi fail scenario')).toBeInTheDocument();
    });

    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
  });
});
