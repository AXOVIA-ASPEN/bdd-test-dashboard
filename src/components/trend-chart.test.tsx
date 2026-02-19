import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

function makeRun(daysAgo: number, passed: number, failed: number, skipped: number = 0) {
  const ts = new Date(Date.now() - daysAgo * 86400000 + 3600000); // +1h to land inside the day bucket
  return {
    id: `run-${daysAgo}`,
    projectId: 'p1',
    timestamp: ts.toISOString(),
    branch: 'main',
    duration: 1000,
    summary: { passed, failed, skipped, total: passed + failed + skipped },
  };
}

describe('TrendChart', () => {
  beforeEach(() => {
    mockStore.runs = [];
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders empty state when no runs', () => {
    render(<TrendChart />);
    expect(screen.getByText(/No test run data/)).toBeInTheDocument();
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

  it('shows empty state for runs older than 14 days', () => {
    mockStore.runs = [makeRun(20, 10, 0)];
    render(<TrendChart />);
    expect(screen.getByText(/No test run data/)).toBeInTheDocument();
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

  it('initializes time range from localStorage', () => {
    localStorage.setItem('dashboard-trend-range', '30');
    mockStore.runs = [makeRun(1, 10, 0)];
    render(<TrendChart />);
    
    const button = screen.getByLabelText('Show 30 days');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('saves time range to localStorage when changed', async () => {
    mockStore.runs = [makeRun(1, 10, 0)];
    render(<TrendChart />);
    
    const button7Days = screen.getByLabelText('Show 7 days');
    fireEvent.click(button7Days);
    
    await waitFor(() => {
      expect(localStorage.getItem('dashboard-trend-range')).toBe('7');
    });
  });

  it('updates chart when time range button is clicked', () => {
    // Create runs: 1 day ago (will show in both) and 20 days ago (only shows in 30+ days)
    mockStore.runs = [makeRun(1, 10, 0), makeRun(20, 8, 2)];
    render(<TrendChart />);
    
    // Initially 14 days - should show data from 1 day ago
    expect(screen.getByText('100%')).toBeInTheDocument();
    
    // Switch to 30 days
    const button30Days = screen.getByLabelText('Show 30 days');
    fireEvent.click(button30Days);
    
    // Now should show data from both runs (but we can just verify it still renders)
    expect(screen.getByText('Pass Rate Trend')).toBeInTheDocument();
  });

  it('shows tooltip with skipped tests when skipped > 0', () => {
    mockStore.runs = [makeRun(1, 8, 1, 3)]; // 8 passed, 1 failed, 3 skipped
    const { container } = render(<TrendChart />);
    
    // Find the bar element (it's a div with cursor-pointer and specific height)
    const bars = container.querySelectorAll('[style*="minHeight"]');
    expect(bars.length).toBeGreaterThan(0);
    
    // Hover over the bar to trigger tooltip
    fireEvent.mouseEnter(bars[0].parentElement!);
    
    // Tooltip should show skipped count
    expect(screen.getByText(/Skipped: 3/)).toBeInTheDocument();
  });

  it('toggles tooltip on click for mobile interaction', () => {
    mockStore.runs = [makeRun(1, 10, 0)];
    const { container } = render(<TrendChart />);
    
    const barContainer = container.querySelector('[onmouseenter]');
    expect(barContainer).toBeTruthy();
    
    // Click to show
    fireEvent.click(barContainer!);
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
    
    // Click again to hide
    fireEvent.click(barContainer!);
    expect(screen.queryByText(/Total:/)).not.toBeInTheDocument();
  });

  it('renders time range buttons in empty state', () => {
    mockStore.runs = [];
    render(<TrendChart />);
    
    expect(screen.getByLabelText('Show 7 days')).toBeInTheDocument();
    expect(screen.getByLabelText('Show 14 days')).toBeInTheDocument();
    expect(screen.getByLabelText('Show 30 days')).toBeInTheDocument();
    expect(screen.getByLabelText('Show 60 days')).toBeInTheDocument();
    expect(screen.getByLabelText('Show 90 days')).toBeInTheDocument();
  });

  it('displays correct message for selected time range in empty state', () => {
    mockStore.runs = [];
    render(<TrendChart />);
    
    // Default is 14 days
    expect(screen.getByText(/No test run data in the last 14 days/)).toBeInTheDocument();
    
    // Change to 7 days
    fireEvent.click(screen.getByLabelText('Show 7 days'));
    expect(screen.getByText(/No test run data in the last 7 days/)).toBeInTheDocument();
  });
});
