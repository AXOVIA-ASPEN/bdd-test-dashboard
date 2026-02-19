import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentRuns } from './recent-runs';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, transition, whileTap, whileHover, exit, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('@/lib/utils', () => ({
  formatDate: (ts: string) => '2026-01-15',
  formatTime: (ts: string) => '10:30',
  formatDuration: (ms: number) => `${ms}ms`,
  statusBg: (status: string) => `bg-${status}`,
  deriveRunStatus: (run: any) => {
    if (run.status) return run.status;
    if ((run.summary?.failed ?? 0) > 0) return 'failed';
    if ((run.summary?.skipped ?? 0) > 0) return 'skipped';
    return 'passed';
  },
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

const mockStore: any = {};
vi.mock('@/store/use-dashboard-store', () => ({
  useDashboardStore: (selector: any) => selector(mockStore),
}));

describe('RecentRuns', () => {
  beforeEach(() => {
    mockStore.loading = false;
    mockStore.projects = [];
    mockStore.runs = [];
  });

  it('shows empty message when no runs', () => {
    render(<RecentRuns />);
    expect(screen.getByText(/no test runs yet/i)).toBeInTheDocument();
  });

  it('renders runs with project name and stats', () => {
    mockStore.projects = [
      { id: 'p1', name: 'Docmind', description: '', color: '#3b82f6', repo: '', makeTarget: '', tags: [] },
    ];
    mockStore.runs = [
      {
        id: 'r1', projectId: 'p1', timestamp: '2026-01-15T10:30:00Z',
        branch: 'main', duration: 5000,
        summary: { passed: 9, failed: 1, skipped: 0, total: 10 },
      },
    ];

    render(<RecentRuns />);
    expect(screen.getByText('Docmind')).toBeInTheDocument();
    expect(screen.getByText(/9\/10/)).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
  });

  it('derives status from summary when status field missing', () => {
    mockStore.projects = [{ id: 'p1', name: 'P1', description: '', color: '#fff', repo: '', makeTarget: '', tags: [] }];
    mockStore.runs = [
      {
        id: 'r1', projectId: 'p1', timestamp: '2026-01-15T10:30:00Z',
        branch: 'main', duration: 1000,
        summary: { passed: 10, failed: 0, skipped: 0, total: 10 },
      },
    ];

    render(<RecentRuns />);
    expect(screen.getByText('passed')).toBeInTheDocument();
  });

  it('shows skipped status when only skipped tests', () => {
    mockStore.projects = [{ id: 'p1', name: 'P1', description: '', color: '#fff', repo: '', makeTarget: '', tags: [] }];
    mockStore.runs = [
      {
        id: 'r1', projectId: 'p1', timestamp: '2026-01-15T10:30:00Z',
        branch: 'main', duration: 1000,
        summary: { passed: 0, failed: 0, skipped: 5, total: 5 },
      },
    ];

    render(<RecentRuns />);
    expect(screen.getByText('skipped')).toBeInTheDocument();
  });

  it('links to the correct run detail page', () => {
    mockStore.projects = [{ id: 'p1', name: 'P1', description: '', color: '#fff', repo: '', makeTarget: '', tags: [] }];
    mockStore.runs = [
      {
        id: 'r1', projectId: 'p1', timestamp: '2026-01-15T10:30:00Z',
        branch: 'main', duration: 1000,
        summary: { passed: 5, failed: 0, skipped: 0, total: 5 },
      },
    ];

    render(<RecentRuns />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/project/p1/run/r1/');
  });

  it('displays duration alongside pass count', () => {
    mockStore.projects = [
      { id: 'p1', name: 'Docmind', description: '', color: '#3b82f6', repo: '', makeTarget: '', tags: [] },
    ];
    mockStore.runs = [
      {
        id: 'r1', projectId: 'p1', timestamp: '2026-01-15T10:30:00Z',
        branch: 'main', duration: 5000,
        summary: { passed: 12, failed: 0, skipped: 0, total: 12 },
      },
    ];

    render(<RecentRuns />);
    expect(screen.getByText(/12\/12/)).toBeInTheDocument();
    expect(screen.getByText(/5000ms/)).toBeInTheDocument();
  });

  it('handles missing duration gracefully', () => {
    mockStore.projects = [
      { id: 'p1', name: 'P1', description: '', color: '#fff', repo: '', makeTarget: '', tags: [] },
    ];
    mockStore.runs = [
      {
        id: 'r1', projectId: 'p1', timestamp: '2026-01-15T10:30:00Z',
        branch: 'main',
        summary: { passed: 3, failed: 0, skipped: 0, total: 3 },
      },
    ];

    render(<RecentRuns />);
    expect(screen.getByText(/3\/3/)).toBeInTheDocument();
  });

  // NEW TESTS FOR MISSING COVERAGE

  it('shows loading skeleton when loading is true', () => {
    mockStore.loading = true;
    mockStore.projects = [];
    mockStore.runs = [];

    render(<RecentRuns />);
    expect(screen.getByText('Recent Test Runs')).toBeInTheDocument();
    // Should show skeleton placeholders, not real data
    expect(screen.queryByText('Docmind')).not.toBeInTheDocument();
  });

  it('displays environment when present in run data', () => {
    mockStore.projects = [
      { id: 'p1', name: 'P1', description: '', color: '#fff', repo: '', makeTarget: '', tags: [] },
    ];
    mockStore.runs = [
      {
        id: 'r1', projectId: 'p1', timestamp: '2026-01-15T10:30:00Z',
        branch: 'main', environment: 'staging', duration: 1000,
        summary: { passed: 5, failed: 0, skipped: 0, total: 5 },
      },
    ];

    render(<RecentRuns />);
    expect(screen.getByText(/staging/)).toBeInTheDocument();
  });

  it('filters runs by status when filter button is clicked', () => {
    mockStore.projects = [
      { id: 'p1', name: 'P1', description: '', color: '#fff', repo: '', makeTarget: '', tags: [] },
    ];
    mockStore.runs = [
      {
        id: 'r1', projectId: 'p1', timestamp: '2026-01-15T10:30:00Z',
        branch: 'main', duration: 1000,
        summary: { passed: 10, failed: 0, skipped: 0, total: 10 },
      },
      {
        id: 'r2', projectId: 'p1', timestamp: '2026-01-15T11:00:00Z',
        branch: 'main', duration: 1500,
        summary: { passed: 5, failed: 3, skipped: 0, total: 8 },
      },
    ];

    const { rerender } = render(<RecentRuns />);
    // Initially, both runs visible
    expect(screen.getAllByRole('link')).toHaveLength(2);

    // Click "Failed" filter
    const failedButton = screen.getByRole('button', { name: /Failed \(1\)/ });
    failedButton.click();

    // Re-render to apply filter
    rerender(<RecentRuns />);
    
    // Now only failed runs should be visible
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
  });

  it('shows "Show More" button when runs exceed page size', () => {
    mockStore.projects = [
      { id: 'p1', name: 'P1', description: '', color: '#fff', repo: '', makeTarget: '', tags: [] },
    ];
    // Create 15 runs (page size is 10)
    mockStore.runs = Array.from({ length: 15 }, (_, i) => ({
      id: `r${i}`,
      projectId: 'p1',
      timestamp: '2026-01-15T10:30:00Z',
      branch: 'main',
      duration: 1000,
      summary: { passed: 5, failed: 0, skipped: 0, total: 5 },
    }));

    render(<RecentRuns />);
    
    // Should only show 10 runs initially
    expect(screen.getAllByRole('link')).toHaveLength(10);
    
    // Should show "Show More" button with remaining count
    expect(screen.getByText(/Show More \(5 remaining\)/)).toBeInTheDocument();
  });

  it('loads more runs when "Show More" button is clicked', () => {
    mockStore.projects = [
      { id: 'p1', name: 'P1', description: '', color: '#fff', repo: '', makeTarget: '', tags: [] },
    ];
    mockStore.runs = Array.from({ length: 15 }, (_, i) => ({
      id: `r${i}`,
      projectId: 'p1',
      timestamp: '2026-01-15T10:30:00Z',
      branch: 'main',
      duration: 1000,
      summary: { passed: 5, failed: 0, skipped: 0, total: 5 },
    }));

    const { rerender } = render(<RecentRuns />);
    
    const showMoreButton = screen.getByText(/Show More/);
    showMoreButton.click();
    
    rerender(<RecentRuns />);
    
    // Should now show all 15 runs
    expect(screen.getAllByRole('link')).toHaveLength(15);
    
    // "Show More" button should be gone
    expect(screen.queryByText(/Show More/)).not.toBeInTheDocument();
  });

  it('hides "Show More" button when all runs are visible', () => {
    mockStore.projects = [
      { id: 'p1', name: 'P1', description: '', color: '#fff', repo: '', makeTarget: '', tags: [] },
    ];
    mockStore.runs = Array.from({ length: 5 }, (_, i) => ({
      id: `r${i}`,
      projectId: 'p1',
      timestamp: '2026-01-15T10:30:00Z',
      branch: 'main',
      duration: 1000,
      summary: { passed: 5, failed: 0, skipped: 0, total: 5 },
    }));

    render(<RecentRuns />);
    
    // Only 5 runs (under page size of 10)
    expect(screen.getAllByRole('link')).toHaveLength(5);
    
    // Should NOT show "Show More" button
    expect(screen.queryByText(/Show More/)).not.toBeInTheDocument();
  });

  it('shows empty message for filtered status with no matches', () => {
    mockStore.projects = [
      { id: 'p1', name: 'P1', description: '', color: '#fff', repo: '', makeTarget: '', tags: [] },
    ];
    mockStore.runs = [
      {
        id: 'r1', projectId: 'p1', timestamp: '2026-01-15T10:30:00Z',
        branch: 'main', duration: 1000,
        summary: { passed: 10, failed: 0, skipped: 0, total: 10 },
      },
    ];

    const { rerender } = render(<RecentRuns />);
    
    // Click "Failed" filter (no failed runs)
    const failedButton = screen.getByRole('button', { name: /Failed \(0\)/ });
    failedButton.click();
    
    rerender(<RecentRuns />);
    
    expect(screen.getByText(/No failed runs found/)).toBeInTheDocument();
  });

  it('resets visible count when changing filter', () => {
    mockStore.projects = [
      { id: 'p1', name: 'P1', description: '', color: '#fff', repo: '', makeTarget: '', tags: [] },
    ];
    // Create 25 runs: 15 passed, 10 failed
    mockStore.runs = [
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `pass-${i}`,
        projectId: 'p1',
        timestamp: '2026-01-15T10:30:00Z',
        branch: 'main',
        duration: 1000,
        summary: { passed: 5, failed: 0, skipped: 0, total: 5 },
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `fail-${i}`,
        projectId: 'p1',
        timestamp: '2026-01-15T10:30:00Z',
        branch: 'main',
        duration: 1000,
        summary: { passed: 0, failed: 5, skipped: 0, total: 5 },
      })),
    ];

    const { rerender } = render(<RecentRuns />);
    
    // Show more to increase visible count
    const showMoreButton = screen.getByText(/Show More/);
    showMoreButton.click();
    rerender(<RecentRuns />);
    
    // Now click a filter - should reset to page size (10)
    const failedButton = screen.getByRole('button', { name: /Failed \(10\)/ });
    failedButton.click();
    rerender(<RecentRuns />);
    
    // Should only show 10 failed runs (page size), not all visible from before
    expect(screen.getAllByRole('link')).toHaveLength(10);
  });

  it('renders filter pills with correct counts', () => {
    mockStore.projects = [
      { id: 'p1', name: 'P1', description: '', color: '#fff', repo: '', makeTarget: '', tags: [] },
    ];
    mockStore.runs = [
      {
        id: 'r1', projectId: 'p1', timestamp: '2026-01-15T10:30:00Z',
        branch: 'main', duration: 1000,
        summary: { passed: 10, failed: 0, skipped: 0, total: 10 },
      },
      {
        id: 'r2', projectId: 'p1', timestamp: '2026-01-15T11:00:00Z',
        branch: 'main', duration: 1000,
        summary: { passed: 5, failed: 3, skipped: 0, total: 8 },
      },
      {
        id: 'r3', projectId: 'p1', timestamp: '2026-01-15T12:00:00Z',
        branch: 'main', duration: 1000,
        summary: { passed: 0, failed: 0, skipped: 5, total: 5 },
      },
    ];

    render(<RecentRuns />);
    
    expect(screen.getByRole('button', { name: /All \(3\)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Failed \(1\)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Skipped \(1\)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Passed \(1\)/ })).toBeInTheDocument();
  });

  it('displays fallback projectId when project not found', () => {
    mockStore.projects = [];
    mockStore.runs = [
      {
        id: 'r1', projectId: 'unknown-project', timestamp: '2026-01-15T10:30:00Z',
        branch: 'main', duration: 1000,
        summary: { passed: 5, failed: 0, skipped: 0, total: 5 },
      },
    ];

    render(<RecentRuns />);
    expect(screen.getByText('unknown-project')).toBeInTheDocument();
  });
});
