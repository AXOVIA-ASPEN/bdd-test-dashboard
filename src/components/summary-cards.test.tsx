import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useDashboardStore } from '@/store/use-dashboard-store';

// Mock framer-motion to render plain divs
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...filterProps(props)}>{children}</div>,
  },
}));

function filterProps(props: any) {
  const { initial, animate, transition, whileTap, ...rest } = props;
  return rest;
}

import { SummaryCards } from './summary-cards';

describe('SummaryCards', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      loading: false,
      projects: [
        { id: 'p1', name: 'P1', description: '', color: '#f00', repo: '', makeTarget: '', tags: [] },
        { id: 'p2', name: 'P2', description: '', color: '#0f0', repo: '', makeTarget: '', tags: [] },
      ],
      runs: [
        {
          id: 'r1', projectId: 'p1', timestamp: new Date().toISOString(),
          branch: 'main', duration: 5000,
          summary: { passed: 8, failed: 2, skipped: 1, total: 11 },
        },
        {
          id: 'r2', projectId: 'p2', timestamp: new Date().toISOString(),
          branch: 'main', duration: 3000,
          summary: { passed: 5, failed: 0, skipped: 0, total: 5 },
        },
      ],
    });
  });

  it('renders 4 summary cards', () => {
    render(<SummaryCards />);
    expect(screen.getByText('Total Tests')).toBeTruthy();
    expect(screen.getByText('Pass Rate')).toBeTruthy();
    expect(screen.getByText('Failures')).toBeTruthy();
    expect(screen.getByText('Skipped')).toBeTruthy();
  });

  it('calculates correct totals from latest runs', () => {
    render(<SummaryCards />);
    // Total: 11 + 5 = 16
    expect(screen.getByText('16')).toBeTruthy();
    // Failed: 2 + 0 = 2
    expect(screen.getByText('2')).toBeTruthy();
    // Skipped: 1 + 0 = 1
    expect(screen.getByText('1')).toBeTruthy();
    // Pass rate: (8+5)/(11+5) = 13/16 = 81%
    expect(screen.getByText('81%')).toBeTruthy();
  });

  it('shows 0 values when no runs exist', () => {
    useDashboardStore.setState({ runs: [], loading: false });
    render(<SummaryCards />);
    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('uses only the first (latest) run per project', () => {
    // Add an older run for p1 - runs are already sorted, first match wins
    useDashboardStore.setState({
      runs: [
        {
          id: 'r1', projectId: 'p1', timestamp: new Date().toISOString(),
          branch: 'main', duration: 5000,
          summary: { passed: 10, failed: 0, skipped: 0, total: 10 },
        },
        {
          id: 'r-old', projectId: 'p1', timestamp: new Date(Date.now() - 86400000).toISOString(),
          branch: 'main', duration: 5000,
          summary: { passed: 1, failed: 9, skipped: 0, total: 10 },
        },
      ],
    });
    render(<SummaryCards />);
    // Only r1 counts: 10 total, 0 failed
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
  });
});
