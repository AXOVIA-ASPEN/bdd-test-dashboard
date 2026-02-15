import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentRuns } from './recent-runs';

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

vi.mock('@/lib/utils', () => ({
  formatDate: (ts: string) => '2026-01-15',
  formatTime: (ts: string) => '10:30',
  statusBg: (status: string) => `bg-${status}`,
}));

const mockStore: any = {};
vi.mock('@/store/use-dashboard-store', () => ({
  useDashboardStore: (selector: any) => selector(mockStore),
}));

describe('RecentRuns', () => {
  beforeEach(() => {
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
    expect(screen.getByText('9/10')).toBeInTheDocument();
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
});
