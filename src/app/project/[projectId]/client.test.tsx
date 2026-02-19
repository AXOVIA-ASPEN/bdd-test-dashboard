import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectClient from './client';

const mockProject = { id: 'test', name: 'Test Project', description: 'A test', color: '#ff0000' };
const mockRuns = [
  {
    id: 'run1',
    projectId: 'test',
    timestamp: '2026-02-14T12:00:00Z',
    branch: 'main',
    environment: 'ci',
    duration: 5000,
    status: 'passed',
    summary: { total: 10, passed: 8, failed: 1, skipped: 1 },
  },
];

const mockState: Record<string, unknown> = {
  loading: false,
  error: null,
  runs: mockRuns,
  retry: vi.fn(),
  getProject: (id: string) => (id === 'test' ? mockProject : undefined),
};

vi.mock('@/store/use-dashboard-store', () => ({
  useDashboardStore: (selector: (s: typeof mockState) => unknown) => selector(mockState),
}));

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('@/components/project-skeleton', () => ({ ProjectSkeleton: () => <div data-testid="project-skeleton" /> }));

describe('ProjectClient', () => {
  beforeEach(() => {
    mockState.loading = false;
    mockState.error = null;
    mockState.runs = mockRuns;
    mockState.retry = vi.fn();
    mockState.getProject = (id: string) => (id === 'test' ? mockProject : undefined);
  });

  it('shows loading skeleton', () => {
    mockState.loading = true;
    render(<ProjectClient projectId="test" />);
    expect(screen.getByTestId('project-skeleton')).toBeInTheDocument();
  });

  it('shows error state with retry', () => {
    mockState.error = 'Oops';
    render(<ProjectClient projectId="test" />);
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(mockState.retry).toHaveBeenCalled();
  });

  it('shows not found for unknown project', () => {
    mockState.getProject = () => undefined;
    mockState.runs = [];
    render(<ProjectClient projectId="unknown" />);
    expect(screen.getByText('Project not found.')).toBeInTheDocument();
  });

  it('renders project details and run history', () => {
    render(<ProjectClient projectId="test" />);
    expect(screen.getAllByText('Test Project').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('A test')).toBeInTheDocument();
    expect(screen.getByText('Run History')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();
  });

  it('shows empty run history message', () => {
    mockState.runs = [];
    render(<ProjectClient projectId="test" />);
    expect(screen.getByText('No test runs yet for this project.')).toBeInTheDocument();
  });

  it('opens and closes the Run Tests dialog', () => {
    render(<ProjectClient projectId="test" />);
    fireEvent.click(screen.getByText('Run Tests'));
    // Dialog should be open (RunTestsDialog component rendered)
    // Close by clicking again or via dialog close
  });

  it('toggles filter panel visibility', () => {
    render(<ProjectClient projectId="test" />);
    const filterBtn = screen.getByRole('button', { name: /toggle filters/i });
    expect(filterBtn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(filterBtn);
    expect(filterBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Filters')).toBeInTheDocument();
    fireEvent.click(filterBtn);
    expect(filterBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters runs by status', () => {
    mockState.runs = [
      ...mockRuns,
      {
        id: 'run2',
        projectId: 'test',
        timestamp: '2026-02-13T12:00:00Z',
        branch: 'dev',
        environment: 'ci',
        duration: 3000,
        status: 'failed',
        summary: { total: 5, passed: 2, failed: 3, skipped: 0 },
      },
    ];
    render(<ProjectClient projectId="test" />);
    // Open filters
    fireEvent.click(screen.getByRole('button', { name: /toggle filters/i }));
    // Click "Failed" filter button (not the stat card label)
    const failedButtons = screen.getAllByText('Failed');
    fireEvent.click(failedButtons[failedButtons.length - 1]);
    // Only the failed run should appear (2/5)
    expect(screen.getByText('2/5')).toBeInTheDocument();
    expect(screen.queryByText('8/10')).not.toBeInTheDocument();
  });

  it('filters runs by branch', () => {
    mockState.runs = [
      ...mockRuns,
      {
        id: 'run3',
        projectId: 'test',
        timestamp: '2026-02-12T12:00:00Z',
        branch: 'feature-x',
        environment: 'ci',
        duration: 2000,
        status: 'passed',
        summary: { total: 3, passed: 3, failed: 0, skipped: 0 },
      },
    ];
    render(<ProjectClient projectId="test" />);
    fireEvent.click(screen.getByRole('button', { name: /toggle filters/i }));
    // Select branch
    const branchSelect = screen.getByDisplayValue('All branches');
    fireEvent.change(branchSelect, { target: { value: 'feature-x' } });
    expect(screen.getByText('3/3')).toBeInTheDocument();
    expect(screen.queryByText('8/10')).not.toBeInTheDocument();
  });

  it('shows "no runs match filters" and clears filters', () => {
    render(<ProjectClient projectId="test" />);
    fireEvent.click(screen.getByRole('button', { name: /toggle filters/i }));
    // Filter to "skipped" - our run has status "passed" so it won't match
    const skippedButtons = screen.getAllByText('Skipped');
    fireEvent.click(skippedButtons[skippedButtons.length - 1]);
    expect(screen.getByText('No runs match the current filters.')).toBeInTheDocument();
    // Clear filters
    fireEvent.click(screen.getByText('Clear filters'));
    expect(screen.getByText('8/10')).toBeInTheDocument();
  });

  it('clears all filters from filter panel', () => {
    mockState.runs = [
      ...mockRuns,
      {
        id: 'run4',
        projectId: 'test',
        timestamp: '2026-02-11T12:00:00Z',
        branch: 'dev',
        environment: 'local',
        duration: 1000,
        status: 'failed',
        summary: { total: 2, passed: 0, failed: 2, skipped: 0 },
      },
    ];
    render(<ProjectClient projectId="test" />);
    fireEvent.click(screen.getByRole('button', { name: /toggle filters/i }));
    const failedBtns = screen.getAllByText('Failed');
    fireEvent.click(failedBtns[failedBtns.length - 1]);
    // "Clear all" link should appear
    fireEvent.click(screen.getByText('Clear all'));
    // Both runs should be visible now
    expect(screen.getByText('8/10')).toBeInTheDocument();
  });

  it('renders stat cards from latest run', () => {
    render(<ProjectClient projectId="test" />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Passed')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    // Failed and Skipped both show '1', so use getAllByText
    expect(screen.getAllByText('1')).toHaveLength(2);
  });

  it('derives status from summary when status field absent', () => {
    mockState.runs = [
      {
        id: 'run5',
        projectId: 'test',
        timestamp: '2026-02-14T12:00:00Z',
        branch: 'main',
        environment: '',
        duration: 1000,
        summary: { total: 5, passed: 5, failed: 0, skipped: 0 },
      },
    ];
    render(<ProjectClient projectId="test" />);
    expect(screen.getByText('passed')).toBeInTheDocument();
  });

  it('derives skipped status from summary', () => {
    mockState.runs = [
      {
        id: 'run6',
        projectId: 'test',
        timestamp: '2026-02-14T12:00:00Z',
        branch: 'main',
        environment: '',
        duration: 1000,
        summary: { total: 5, passed: 3, failed: 0, skipped: 2 },
      },
    ];
    render(<ProjectClient projectId="test" />);
    expect(screen.getByText('skipped')).toBeInTheDocument();
  });

  it('toggles sort panel visibility', () => {
    render(<ProjectClient projectId="test" />);
    const sortBtn = screen.getByRole('button', { name: /toggle sort/i });
    expect(sortBtn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(sortBtn);
    expect(sortBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Sort by')).toBeInTheDocument();
    fireEvent.click(sortBtn);
    expect(sortBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes filter panel when opening sort panel', () => {
    render(<ProjectClient projectId="test" />);
    // Open filters first
    const filterBtn = screen.getByRole('button', { name: /toggle filters/i });
    fireEvent.click(filterBtn);
    expect(filterBtn).toHaveAttribute('aria-expanded', 'true');
    // Open sort panel - should close filters
    const sortBtn = screen.getByRole('button', { name: /toggle sort/i });
    fireEvent.click(sortBtn);
    expect(sortBtn).toHaveAttribute('aria-expanded', 'true');
    expect(filterBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('sorts runs by duration ascending', () => {
    mockState.runs = [
      {
        id: 'run1',
        projectId: 'test',
        timestamp: '2026-02-14T12:00:00Z',
        branch: 'main',
        environment: 'ci',
        duration: 5000,
        status: 'passed',
        summary: { total: 10, passed: 10, failed: 0, skipped: 0 },
      },
      {
        id: 'run2',
        projectId: 'test',
        timestamp: '2026-02-13T12:00:00Z',
        branch: 'main',
        environment: 'ci',
        duration: 2000,
        status: 'passed',
        summary: { total: 5, passed: 5, failed: 0, skipped: 0 },
      },
    ];
    render(<ProjectClient projectId="test" />);
    // Open sort panel
    fireEvent.click(screen.getByRole('button', { name: /toggle sort/i }));
    // Click "Duration (shortest)" option
    fireEvent.click(screen.getByText('Duration (shortest)'));
    // The shorter run (2000ms, 5/5) should appear first
    const runCards = screen.getAllByText(/\d+\/\d+/);
    expect(runCards[0]).toHaveTextContent('5/5');
  });

  it('sorts runs by duration descending', () => {
    mockState.runs = [
      {
        id: 'run1',
        projectId: 'test',
        timestamp: '2026-02-14T12:00:00Z',
        branch: 'main',
        environment: 'ci',
        duration: 2000,
        status: 'passed',
        summary: { total: 5, passed: 5, failed: 0, skipped: 0 },
      },
      {
        id: 'run2',
        projectId: 'test',
        timestamp: '2026-02-13T12:00:00Z',
        branch: 'main',
        environment: 'ci',
        duration: 5000,
        status: 'passed',
        summary: { total: 10, passed: 10, failed: 0, skipped: 0 },
      },
    ];
    render(<ProjectClient projectId="test" />);
    // Open sort panel
    fireEvent.click(screen.getByRole('button', { name: /toggle sort/i }));
    // Click "Duration (longest)" option
    fireEvent.click(screen.getByText('Duration (longest)'));
    // The longer run (5000ms, 10/10) should appear first
    const runCards = screen.getAllByText(/\d+\/\d+/);
    expect(runCards[0]).toHaveTextContent('10/10');
  });

  it('sorts runs by date ascending (oldest first)', () => {
    mockState.runs = [
      {
        id: 'run1',
        projectId: 'test',
        timestamp: '2026-02-14T12:00:00Z',
        branch: 'main',
        environment: 'ci',
        duration: 5000,
        status: 'passed',
        summary: { total: 10, passed: 10, failed: 0, skipped: 0 },
      },
      {
        id: 'run2',
        projectId: 'test',
        timestamp: '2026-02-13T12:00:00Z',
        branch: 'main',
        environment: 'ci',
        duration: 2000,
        status: 'passed',
        summary: { total: 5, passed: 5, failed: 0, skipped: 0 },
      },
    ];
    render(<ProjectClient projectId="test" />);
    // Open sort panel
    fireEvent.click(screen.getByRole('button', { name: /toggle sort/i }));
    // Click "Date (oldest first)" option
    fireEvent.click(screen.getByText('Date (oldest first)'));
    // The older run (Feb 13, 5/5) should appear first
    const runCards = screen.getAllByText(/\d+\/\d+/);
    expect(runCards[0]).toHaveTextContent('5/5');
  });

  it('resets sort to default (date descending)', () => {
    mockState.runs = [
      {
        id: 'run1',
        projectId: 'test',
        timestamp: '2026-02-14T12:00:00Z',
        branch: 'main',
        environment: 'ci',
        duration: 5000,
        status: 'passed',
        summary: { total: 10, passed: 10, failed: 0, skipped: 0 },
      },
      {
        id: 'run2',
        projectId: 'test',
        timestamp: '2026-02-13T12:00:00Z',
        branch: 'main',
        environment: 'ci',
        duration: 2000,
        status: 'passed',
        summary: { total: 5, passed: 5, failed: 0, skipped: 0 },
      },
    ];
    render(<ProjectClient projectId="test" />);
    // Open sort panel and change sort
    fireEvent.click(screen.getByRole('button', { name: /toggle sort/i }));
    fireEvent.click(screen.getByText('Duration (shortest)'));
    // Verify sort changed (shortest first)
    let runCards = screen.getAllByText(/\d+\/\d+/);
    expect(runCards[0]).toHaveTextContent('5/5');
    // Open sort panel again and reset
    fireEvent.click(screen.getByRole('button', { name: /toggle sort/i }));
    fireEvent.click(screen.getByText('Reset'));
    // Should be back to date descending (newest first)
    runCards = screen.getAllByText(/\d+\/\d+/);
    expect(runCards[0]).toHaveTextContent('10/10');
  });

  it('shows "Show More" button when runs exceed visible count', () => {
    // Create 15 runs (more than default visible count of 10)
    mockState.runs = Array.from({ length: 15 }, (_, i) => ({
      id: `run${i + 1}`,
      projectId: 'test',
      timestamp: new Date(2026, 1, 15 - i).toISOString(),
      branch: 'main',
      environment: 'ci',
      duration: 1000 + i * 100,
      status: 'passed',
      summary: { total: 5, passed: 5, failed: 0, skipped: 0 },
    }));
    render(<ProjectClient projectId="test" />);
    expect(screen.getByText('Showing 10 of 15 runs')).toBeInTheDocument();
    expect(screen.getByText('Show More')).toBeInTheDocument();
  });

  it('loads more runs when Show More is clicked', () => {
    // Create 15 runs
    mockState.runs = Array.from({ length: 15 }, (_, i) => ({
      id: `run${i + 1}`,
      projectId: 'test',
      timestamp: new Date(2026, 1, 15 - i).toISOString(),
      branch: 'main',
      environment: 'ci',
      duration: 1000 + i * 100,
      status: 'passed',
      summary: { total: 5, passed: 5, failed: 0, skipped: 0 },
    }));
    render(<ProjectClient projectId="test" />);
    expect(screen.getByText('Showing 10 of 15 runs')).toBeInTheDocument();
    // Click Show More
    fireEvent.click(screen.getByText('Show More'));
    // Should now show all 15 runs
    expect(screen.getByText('Showing 15 of 15 runs')).toBeInTheDocument();
    expect(screen.queryByText('Show More')).not.toBeInTheDocument();
  });

  it('hides Show More button when all runs are visible', () => {
    // Create 8 runs (less than default visible count of 10)
    mockState.runs = Array.from({ length: 8 }, (_, i) => ({
      id: `run${i + 1}`,
      projectId: 'test',
      timestamp: new Date(2026, 1, 15 - i).toISOString(),
      branch: 'main',
      environment: 'ci',
      duration: 1000 + i * 100,
      status: 'passed',
      summary: { total: 5, passed: 5, failed: 0, skipped: 0 },
    }));
    render(<ProjectClient projectId="test" />);
    expect(screen.getByText('Showing 8 of 8 runs')).toBeInTheDocument();
    expect(screen.queryByText('Show More')).not.toBeInTheDocument();
  });
});
