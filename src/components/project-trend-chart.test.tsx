import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectTrendChart } from './project-trend-chart';
import type { TestRun } from '@/store/use-dashboard-store';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, className, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div style={style as any} className={className as string} data-testid="motion-div">{children}</div>
    ),
  },
}));

function makeRun(overrides: Partial<TestRun> & { timestamp: string }): TestRun {
  return {
    id: Math.random().toString(36).slice(2),
    projectId: 'p1',
    status: 'passed',
    branch: 'main',
    environment: 'ci',
    duration: 1000,
    summary: { total: 10, passed: 10, failed: 0, skipped: 0 },
    features: [],
    ...overrides,
  };
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000 + 3600000).toISOString();
}

describe('ProjectTrendChart', () => {
  it('shows not enough data message when fewer than 2 days of runs', () => {
    const runs = [makeRun({ timestamp: daysAgo(1) })];
    render(<ProjectTrendChart runs={runs} />);
    expect(screen.getByText(/not enough data points/i)).toBeInTheDocument();
  });

  it('shows not enough data message when no runs', () => {
    render(<ProjectTrendChart runs={[]} />);
    expect(screen.getByText(/not enough data points/i)).toBeInTheDocument();
  });

  it('renders chart when 2+ days of runs exist', () => {
    const runs = [
      makeRun({ timestamp: daysAgo(1), summary: { total: 10, passed: 8, failed: 2, skipped: 0 } }),
      makeRun({ timestamp: daysAgo(2), summary: { total: 10, passed: 10, failed: 0, skipped: 0 } }),
    ];
    render(<ProjectTrendChart runs={runs} />);
    expect(screen.getByText('Pass Rate Trend')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('ignores runs older than 14 days', () => {
    const runs = [
      makeRun({ timestamp: daysAgo(1) }),
      makeRun({ timestamp: daysAgo(15) }), // too old
    ];
    render(<ProjectTrendChart runs={runs} />);
    // Only 1 day of data within range → not enough
    expect(screen.getByText(/not enough data points/i)).toBeInTheDocument();
  });

  it('aggregates multiple runs in the same day', () => {
    const dayTs = daysAgo(1);
    const runs = [
      makeRun({ timestamp: dayTs, summary: { total: 10, passed: 5, failed: 5, skipped: 0 } }),
      makeRun({ timestamp: dayTs, summary: { total: 10, passed: 10, failed: 0, skipped: 0 } }),
      makeRun({ timestamp: daysAgo(2), summary: { total: 10, passed: 10, failed: 0, skipped: 0 } }),
    ];
    render(<ProjectTrendChart runs={runs} />);
    // Day 1: 15/20 = 75%, Day 2: 10/10 = 100%
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows 0% when total is 0 for a day', () => {
    const runs = [
      makeRun({ timestamp: daysAgo(1), summary: { total: 0, passed: 0, failed: 0, skipped: 0 } }),
      makeRun({ timestamp: daysAgo(2), summary: { total: 10, passed: 10, failed: 0, skipped: 0 } }),
    ];
    render(<ProjectTrendChart runs={runs} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
