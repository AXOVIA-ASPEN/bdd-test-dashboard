import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from './page';

// Mock the store
const mockStore: Record<string, unknown> = {
  loading: false,
  projects: [],
  error: null,
  retry: vi.fn(),
};

vi.mock('@/store/use-dashboard-store', () => ({
  useDashboardStore: (selector: (s: typeof mockStore) => unknown) => selector(mockStore),
}));

// Mock child components
vi.mock('@/components/summary-cards', () => ({ SummaryCards: () => <div data-testid="summary-cards" /> }));
vi.mock('@/components/trend-chart', () => ({ TrendChart: () => <div data-testid="trend-chart" /> }));
vi.mock('@/components/project-cards', () => ({ ProjectCards: () => <div data-testid="project-cards" /> }));
vi.mock('@/components/recent-runs', () => ({ RecentRuns: () => <div data-testid="recent-runs" /> }));
vi.mock('@/components/dashboard-skeleton', () => ({ DashboardSkeleton: () => <div data-testid="dashboard-skeleton" /> }));

describe('Home page', () => {
  beforeEach(() => {
    mockStore.loading = false;
    mockStore.projects = [];
    mockStore.error = null;
    mockStore.retry = vi.fn();
  });

  it('shows loading skeleton', () => {
    mockStore.loading = true;
    render(<Home />);
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    mockStore.error = 'Network error';
    render(<Home />);
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(mockStore.retry).toHaveBeenCalled();
  });

  it('shows empty state when no projects', () => {
    mockStore.projects = [];
    render(<Home />);
    expect(screen.getByText('No projects configured')).toBeInTheDocument();
  });

  it('renders dashboard components when projects exist', () => {
    mockStore.projects = [{ id: 'test', name: 'Test' }];
    render(<Home />);
    expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    expect(screen.getByTestId('project-cards')).toBeInTheDocument();
    expect(screen.getByTestId('recent-runs')).toBeInTheDocument();
  });
});
