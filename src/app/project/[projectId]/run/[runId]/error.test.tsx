import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RunError from './error';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'proj-123' }),
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="alert-icon" />,
  RefreshCw: () => <span data-testid="refresh-icon" />,
  ArrowLeft: () => <span data-testid="arrow-icon" />,
}));

describe('RunError', () => {
  const mockReset = vi.fn();
  const mockError = new Error('Run load failed');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders error heading', () => {
    render(<RunError error={mockError} reset={mockReset} />);
    expect(screen.getByText('Failed to load run')).toBeInTheDocument();
  });

  it('displays the error message', () => {
    render(<RunError error={mockError} reset={mockReset} />);
    expect(screen.getByText('Run load failed')).toBeInTheDocument();
  });

  it('shows default message when error.message is empty', () => {
    render(<RunError error={new Error('')} reset={mockReset} />);
    expect(screen.getByText('An unexpected error occurred while loading this test run.')).toBeInTheDocument();
  });

  it('calls reset when Retry is clicked', () => {
    render(<RunError error={mockError} reset={mockReset} />);
    fireEvent.click(screen.getByText('Retry'));
    expect(mockReset).toHaveBeenCalledOnce();
  });

  it('renders back link with projectId from params', () => {
    render(<RunError error={mockError} reset={mockReset} />);
    const link = screen.getByText('Back to project').closest('a');
    expect(link).toHaveAttribute('href', '/project/proj-123/');
  });

  it('logs error to console', () => {
    render(<RunError error={mockError} reset={mockReset} />);
    expect(console.error).toHaveBeenCalledWith('Run detail error:', mockError);
  });
});
