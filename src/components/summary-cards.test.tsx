import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCards } from './summary-cards';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...filterProps(props)}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...filterProps(props)}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

function filterProps(props: any) {
  const { initial, animate, transition, whileTap, whileHover, ...rest } = props;
  return rest;
}

// Mock the store
const mockStore: any = {};
vi.mock('@/store/use-dashboard-store', () => ({
  useDashboardStore: (selector: any) => selector(mockStore),
}));

describe('SummaryCards', () => {
  beforeEach(() => {
    mockStore.projects = [];
    mockStore.runs = [];
  });

  it('renders all four cards with zero values when no data', () => {
    render(<SummaryCards />);
    expect(screen.getByText('Total Tests')).toBeInTheDocument();
    expect(screen.getByText('Pass Rate')).toBeInTheDocument();
    expect(screen.getByText('Failures')).toBeInTheDocument();
    expect(screen.getByText('Skipped')).toBeInTheDocument();
    // All values should be 0
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('calculates summary from latest runs per project', () => {
    mockStore.projects = [
      { id: 'p1', name: 'P1', description: '', color: '#fff', repo: '', makeTarget: '', tags: [] },
      { id: 'p2', name: 'P2', description: '', color: '#fff', repo: '', makeTarget: '', tags: [] },
    ];
    mockStore.runs = [
      { id: 'r1', projectId: 'p1', timestamp: '2026-01-01', branch: 'main', duration: 100, summary: { passed: 8, failed: 1, skipped: 1, total: 10 } },
      { id: 'r2', projectId: 'p2', timestamp: '2026-01-01', branch: 'main', duration: 50, summary: { passed: 5, failed: 0, skipped: 0, total: 5 } },
    ];

    render(<SummaryCards />);
    // total = 10 + 5 = 15
    expect(screen.getByText('15')).toBeInTheDocument();
    // pass rate = (8+5)/15 = 87%
    expect(screen.getByText('87%')).toBeInTheDocument();
    // Check failures and skipped exist (use getAllByText since '1' appears twice)
    const ones = screen.getAllByText('1');
    expect(ones.length).toBe(2); // 1 failed + 1 skipped
  });

  it('shows 0% pass rate when total is 0', () => {
    mockStore.projects = [
      { id: 'p1', name: 'P1', description: '', color: '#fff', repo: '', makeTarget: '', tags: [] },
    ];
    mockStore.runs = [
      { id: 'r1', projectId: 'p1', timestamp: '2026-01-01', branch: 'main', duration: 0, summary: { passed: 0, failed: 0, skipped: 0, total: 0 } },
    ];

    render(<SummaryCards />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
