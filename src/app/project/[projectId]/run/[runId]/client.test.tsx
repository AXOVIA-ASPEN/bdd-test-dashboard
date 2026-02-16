import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RunClient from './client';

const mockProject = { id: 'test', name: 'Test Project', color: '#ff0000' };

vi.mock('@/store/use-dashboard-store', () => ({
  useDashboardStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ getProject: (id: string) => (id === 'test' ? mockProject : undefined) }),
}));

const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();

vi.mock('@/lib/firebase', () => ({
  getDb: () => ({}),
}));

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
    doc: vi.fn((_db: unknown, _col: string, id: string) => ({ id })),
    collection: vi.fn(),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
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

describe('RunClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially then not found', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    render(<RunClient projectId="test" runId="run1" />);
    expect(screen.getByTestId('run-detail-skeleton')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Run not found.')).toBeInTheDocument();
    });
  });

  it('renders run details when data loads', async () => {
    mockGetDoc.mockResolvedValue({
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
    });
    mockGetDocs.mockResolvedValue({
      docs: [
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
    });

    render(<RunClient projectId="test" runId="run1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
    expect(screen.getAllByText('passed').length).toBeGreaterThan(0);
    expect(screen.getByText('Login Feature')).toBeInTheDocument();
    expect(screen.getByText('Valid login')).toBeInTheDocument();
  });

  it('renders failed steps with error messages', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'run2',
      data: () => ({
        projectId: 'test',
        timestamp: '2026-02-14T12:00:00Z',
        branch: 'main',
        duration: 3000,
        summary: { total: 1, passed: 0, failed: 1, skipped: 0 },
      }),
    });
    mockGetDocs.mockResolvedValue({
      docs: [
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
    });

    render(<RunClient projectId="test" runId="run2" />);

    await waitFor(() => {
      expect(screen.getByText('Broken Feature')).toBeInTheDocument();
    });
    // Error should be truncated, show "Show more" button
    expect(screen.getByText('Show more')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Show more'));
    expect(screen.getByText('Show less')).toBeInTheDocument();
  });

  it('shows no detailed results when features empty', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'run3',
      data: () => ({
        projectId: 'test',
        timestamp: '2026-02-14T12:00:00Z',
        branch: 'main',
        duration: 0,
        summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
      }),
    });
    mockGetDocs.mockResolvedValue({ docs: [] });

    render(<RunClient projectId="test" runId="run3" />);

    await waitFor(() => {
      expect(screen.getByText('No detailed results for this run.')).toBeInTheDocument();
    });
  });

  it('displays run error banner when run.error is set', async () => {
    mockGetDoc.mockResolvedValue({
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
    });
    mockGetDocs.mockResolvedValue({ docs: [] });

    render(<RunClient projectId="test" runId="run-err" />);

    await waitFor(() => {
      expect(screen.getByText('Run Error')).toBeInTheDocument();
    });
    expect(screen.getByText(/Build failed: exit code 1/)).toBeInTheDocument();
  });

  it('handles placeholder runId gracefully', () => {
    render(<RunClient projectId="test" runId="_" />);
    // Should skip loading and show not found
    expect(screen.queryByText('Loading run...')).not.toBeInTheDocument();
    expect(screen.getByText('Run not found.')).toBeInTheDocument();
  });
});
