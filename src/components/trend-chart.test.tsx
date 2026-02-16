import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendChart } from './trend-chart';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, transition, whileTap, whileHover, exit, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockStore: any = {};
vi.mock('@/store/use-dashboard-store', () => ({
  useDashboardStore: (selector: any) => selector(mockStore),
}));

function makeRun(daysAgo: number, passed: number, failed: number) {
  const ts = new Date(Date.now() - daysAgo * 86400000 + 3600000); // +1h to land inside the day bucket
  return {
    id: `run-${daysAgo}`,
    projectId: 'p1',
    timestamp: ts.toISOString(),
    branch: 'main',
    duration: 1000,
    summary: { passed, failed, skipped: 0, total: passed + failed },
  };
}

describe('TrendChart', () => {
  beforeEach(() => {
    mockStore.runs = [];
  });

  it('renders nothing when no runs', () => {
    const { container } = render(<TrendChart />);
    expect(container.innerHTML).toBe('');
  });

  it('renders chart with data when runs exist within 14 days', () => {
    mockStore.runs = [makeRun(1, 9, 1), makeRun(2, 8, 2)];
    render(<TrendChart />);
    expect(screen.getByText('Pass Rate Trend')).toBeInTheDocument();
  });

  it('shows percentage labels for each day', () => {
    mockStore.runs = [makeRun(1, 10, 0)]; // 100%
    render(<TrendChart />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calculates correct pass rate with mixed results', () => {
    mockStore.runs = [makeRun(1, 7, 3)]; // 70%
    render(<TrendChart />);
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('aggregates multiple runs in the same day', () => {
    const ts = new Date(Date.now() - 1 * 86400000 + 3600000);
    const run1 = {
      id: 'r1', projectId: 'p1', timestamp: ts.toISOString(),
      branch: 'main', duration: 100, summary: { passed: 5, failed: 5, skipped: 0, total: 10 },
    };
    const run2 = {
      id: 'r2', projectId: 'p1', timestamp: new Date(ts.getTime() + 1000).toISOString(),
      branch: 'main', duration: 100, summary: { passed: 10, failed: 0, skipped: 0, total: 10 },
    };
    mockStore.runs = [run1, run2];
    render(<TrendChart />);
    // (5+10)/(10+10) = 75%
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('ignores runs older than 14 days', () => {
    mockStore.runs = [makeRun(20, 10, 0)];
    const { container } = render(<TrendChart />);
    expect(container.innerHTML).toBe('');
  });

  it('shows 0% when total is 0 for a day', () => {
    const ts = new Date(Date.now() - 1 * 86400000 + 3600000);
    mockStore.runs = [{
      id: 'r1', projectId: 'p1', timestamp: ts.toISOString(),
      branch: 'main', duration: 100, summary: { passed: 0, failed: 0, skipped: 0, total: 0 },
    }];
    render(<TrendChart />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
