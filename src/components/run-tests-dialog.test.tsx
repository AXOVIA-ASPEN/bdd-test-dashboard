import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
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
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
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

  it('calls onClose when Close is clicked', () => {
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    fireEvent.click(screen.getByText('Close'));
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

  it('shows coming soon notice explaining remote execution is not available', () => {
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(screen.getByText(/Remote test execution requires/)).toBeInTheDocument();
  });

  it('shows run locally command preview section', () => {
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    expect(screen.getByText('Run locally')).toBeInTheDocument();
  });

  it('handles project with no tags', () => {
    const noTagProject = { ...mockProject, tags: undefined } as any;
    render(
      <RunTestsDialog project={noTagProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    expect(screen.getByText('make test-bdd')).toBeInTheDocument();
  });

  // Copy-to-clipboard tests
  it('renders copy button next to command preview', () => {
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    expect(screen.getByRole('button', { name: 'Copy command' })).toBeInTheDocument();
  });

  it('calls clipboard.writeText with the command when copy is clicked', async () => {
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    const copyBtn = screen.getByRole('button', { name: 'Copy command' });
    await act(async () => { fireEvent.click(copyBtn); });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('make test-bdd');
  });

  it('copies the full command including tags when tags are selected', async () => {
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    fireEvent.click(screen.getByText('@smoke'));
    const copyBtn = screen.getByRole('button', { name: 'Copy command' });
    await act(async () => { fireEvent.click(copyBtn); });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('make test-bdd TAGS="@smoke"');
  });

  it('shows checkmark feedback after copy and reverts after 2 seconds', async () => {
    vi.useFakeTimers();
    render(
      <RunTestsDialog project={mockProject} open={true} onClose={onClose} onTriggered={onTriggered} />
    );
    const copyBtn = screen.getByRole('button', { name: 'Copy command' });
    await act(async () => { fireEvent.click(copyBtn); });
    // After clicking, aria-label should change to 'Copied!'
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    // After 2 seconds, reverts to 'Copy command'
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(screen.getByRole('button', { name: 'Copy command' })).toBeInTheDocument();
    vi.useRealTimers();
  });
});
