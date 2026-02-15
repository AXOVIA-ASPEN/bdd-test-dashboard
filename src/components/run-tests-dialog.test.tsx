import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RunTestsDialog } from './run-tests-dialog';
import type { Project } from '@/store/use-dashboard-store';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock the API
vi.mock('@/lib/api', () => ({
  triggerRun: vi.fn(),
}));

const mockProject: Project = {
  id: 'proj-1',
  name: 'Test Project',
  repo: 'org/test-repo',
  makeTarget: 'test-bdd',
  tags: ['@smoke', '@regression', '@api'],
  lastRun: '2026-02-01T00:00:00Z',
  totalRuns: 10,
  passRate: 85,
};

describe('RunTestsDialog', () => {
  const onClose = vi.fn();
  const onTriggered = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <RunTestsDialog project={mockProject} open={false} onClose={onClose} onTriggered={onTriggered} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders dialog when open', () => {
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    expect(screen.getByText(/Run Tests — Test Project/)).toBeInTheDocument();
    expect(screen.getByText('Run Tests')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders all project tags', () => {
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    expect(screen.getByText('@smoke')).toBeInTheDocument();
    expect(screen.getByText('@regression')).toBeInTheDocument();
    expect(screen.getByText('@api')).toBeInTheDocument();
  });

  it('shows base command preview without tags', () => {
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    expect(screen.getByText('make test-bdd')).toBeInTheDocument();
  });

  it('updates command preview when tags are selected', () => {
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    fireEvent.click(screen.getByText('@smoke'));
    expect(screen.getByText('make test-bdd TAGS="@smoke"')).toBeInTheDocument();
  });

  it('updates command preview with multiple tags', () => {
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    fireEvent.click(screen.getByText('@smoke'));
    fireEvent.click(screen.getByText('@api'));
    expect(screen.getByText('make test-bdd TAGS="@smoke and @api"')).toBeInTheDocument();
  });

  it('deselects tag on second click', () => {
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    fireEvent.click(screen.getByText('@smoke'));
    fireEvent.click(screen.getByText('@smoke'));
    expect(screen.getByText('make test-bdd')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    // The outer div is the backdrop
    const backdrop = screen.getByText(/Run Tests — Test Project/).closest('.fixed');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('allows branch input change', () => {
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    const input = screen.getByDisplayValue('main');
    fireEvent.change(input, { target: { value: 'develop' } });
    expect(screen.getByDisplayValue('develop')).toBeInTheDocument();
  });

  it('submits successfully and calls onTriggered', async () => {
    const { triggerRun } = await import('@/lib/api');
    (triggerRun as any).mockResolvedValue({ runId: 'run-123' });

    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    fireEvent.click(screen.getByText('Run Tests'));

    await waitFor(() => {
      expect(triggerRun).toHaveBeenCalledWith({
        projectId: 'proj-1',
        repo: 'org/test-repo',
        tags: [],
        branch: 'main',
        makeTarget: 'test-bdd',
      });
      expect(onTriggered).toHaveBeenCalledWith('run-123');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows error on submit failure', async () => {
    const { triggerRun } = await import('@/lib/api');
    (triggerRun as any).mockRejectedValue(new Error('Network error'));

    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    fireEvent.click(screen.getByText('Run Tests'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('handles project with no tags', () => {
    const noTagProject = { ...mockProject, tags: undefined } as any;
    render(
      <RunTestsDialog project={noTagProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    expect(screen.getByText('make test-bdd')).toBeInTheDocument();
  });
});
