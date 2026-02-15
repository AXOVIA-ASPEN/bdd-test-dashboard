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
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test')).toBeInTheDocument();
    expect(screen.getByText('Run History')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();
  });

  it('shows empty run history message', () => {
    mockState.runs = [];
    render(<ProjectClient projectId="test" />);
    expect(screen.getByText('No test runs yet for this project.')).toBeInTheDocument();
  });
});
