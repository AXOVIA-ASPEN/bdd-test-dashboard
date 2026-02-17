import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectCards } from './project-cards';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, transition, whileTap, whileHover, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('lucide-react', () => ({
  ChevronRight: () => <span data-testid="chevron" />,
  Search: () => <span data-testid="search-icon" />,
  X: () => <span data-testid="x-icon" />,
}));

const mockStore: any = {};
vi.mock('@/store/use-dashboard-store', () => ({
  useDashboardStore: (selector: any) => selector(mockStore),
}));

const project = (id: string, name: string) => ({
  id, name, description: `${name} desc`, color: '#ff0000', repo: '', makeTarget: '', tags: [],
});

const run = (projectId: string, passed: number, failed: number, skipped: number) => ({
  id: `run-${projectId}`,
  projectId,
  timestamp: new Date().toISOString(),
  branch: 'main',
  duration: 1000,
  summary: { passed, failed, skipped, total: passed + failed + skipped },
});

describe('ProjectCards', () => {
  beforeEach(() => {
    mockStore.projects = [];
    mockStore.runs = [];
  });

  it('renders nothing when no projects', () => {
    const { container } = render(<ProjectCards />);
    expect(container.innerHTML).toBe('');
  });

  it('renders project names and descriptions', () => {
    mockStore.projects = [project('p1', 'Alpha'), project('p2', 'Beta')];
    render(<ProjectCards />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Alpha desc')).toBeInTheDocument();
  });

  it('shows "No runs yet" when project has no runs', () => {
    mockStore.projects = [project('p1', 'Alpha')];
    render(<ProjectCards />);
    expect(screen.getByText('No runs yet')).toBeInTheDocument();
  });

  it('shows pass/fail/skip counts when runs exist', () => {
    mockStore.projects = [project('p1', 'Alpha')];
    mockStore.runs = [run('p1', 8, 1, 1)];
    render(<ProjectCards />);
    expect(screen.getByText('8 passed')).toBeInTheDocument();
    expect(screen.getByText('1 failed')).toBeInTheDocument();
    expect(screen.getByText('1 skipped')).toBeInTheDocument();
  });

  it('calculates pass rate for progress bar width', () => {
    mockStore.projects = [project('p1', 'Alpha')];
    mockStore.runs = [run('p1', 75, 25, 0)];
    render(<ProjectCards />);
    // 75/100 = 75%
    const bar = document.querySelector('[style*="width: 75%"]');
    expect(bar).toBeInTheDocument();
  });

  it('links to project detail page', () => {
    mockStore.projects = [project('p1', 'Alpha')];
    mockStore.runs = [run('p1', 10, 0, 0)];
    render(<ProjectCards />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/project/p1/');
  });

  it('shows 0% rate label when total is 0', () => {
    mockStore.projects = [project('p1', 'Alpha')];
    mockStore.runs = [{ ...run('p1', 0, 0, 0), summary: { passed: 0, failed: 0, skipped: 0, total: 0 } }];
    render(<ProjectCards />);
    // When all counts are 0 the segments are filtered out, but the rate label (0%) should still show
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders the heading', () => {
    mockStore.projects = [project('p1', 'Alpha')];
    render(<ProjectCards />);
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  // ── Health badge state tests ─────────────────────────────────────────────

  it('shows ✅ Passing badge when all tests passed and none skipped', () => {
    mockStore.projects = [project('p1', 'Alpha')];
    mockStore.runs = [run('p1', 10, 0, 0)];
    render(<ProjectCards />);
    expect(screen.getByText('Passing')).toBeInTheDocument();
  });

  it('shows ✅ Passing badge when tests passed with some skipped (not Flaky)', () => {
    mockStore.projects = [project('p1', 'Alpha')];
    // 50 passed, 0 failed, 5 skipped — all *executed* tests passed
    mockStore.runs = [run('p1', 50, 0, 5)];
    render(<ProjectCards />);
    expect(screen.getByText('Passing')).toBeInTheDocument();
    expect(screen.queryByText('Flaky')).not.toBeInTheDocument();
  });

  it('shows ⏭️ All Skipped badge when every test is skipped', () => {
    mockStore.projects = [project('p1', 'Alpha')];
    mockStore.runs = [run('p1', 0, 0, 8)];
    render(<ProjectCards />);
    expect(screen.getByText('All Skipped')).toBeInTheDocument();
  });

  it('shows ❌ Failing badge when there are failures, regardless of skipped count', () => {
    mockStore.projects = [project('p1', 'Alpha')];
    // 5 passed, 2 failed, 3 skipped — failures dominate
    mockStore.runs = [run('p1', 5, 2, 3)];
    render(<ProjectCards />);
    expect(screen.getByText('Failing')).toBeInTheDocument();
    expect(screen.queryByText('Passing')).not.toBeInTheDocument();
    expect(screen.queryByText('Flaky')).not.toBeInTheDocument();
  });

  it('shows ❌ Failing badge even when skipped count is high', () => {
    mockStore.projects = [project('p1', 'Alpha')];
    // 0 passed, 1 failed, 99 skipped — still Failing
    mockStore.runs = [run('p1', 0, 1, 99)];
    render(<ProjectCards />);
    expect(screen.getByText('Failing')).toBeInTheDocument();
  });

  it('shows ⏳ No runs badge when project has no run data', () => {
    mockStore.projects = [project('p1', 'Alpha')];
    mockStore.runs = [];
    render(<ProjectCards />);
    expect(screen.getByText('No runs')).toBeInTheDocument();
  });
});
