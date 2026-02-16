import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectError from './error';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="alert-icon" />,
  RefreshCw: () => <span data-testid="refresh-icon" />,
  Home: () => <span data-testid="home-icon" />,
}));

describe('ProjectError', () => {
  const mockReset = vi.fn();
  const mockError = new Error('Project load failed');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders error heading', () => {
    render(<ProjectError error={mockError} reset={mockReset} />);
    expect(screen.getByText('Failed to load project')).toBeInTheDocument();
  });

  it('displays the error message', () => {
    render(<ProjectError error={mockError} reset={mockReset} />);
    expect(screen.getByText('Project load failed')).toBeInTheDocument();
  });

  it('shows default message when error.message is empty', () => {
    render(<ProjectError error={new Error('')} reset={mockReset} />);
    expect(screen.getByText('An unexpected error occurred while loading this project.')).toBeInTheDocument();
  });

  it('calls reset when Retry is clicked', () => {
    render(<ProjectError error={mockError} reset={mockReset} />);
    fireEvent.click(screen.getByText('Retry'));
    expect(mockReset).toHaveBeenCalledOnce();
  });

  it('renders Dashboard link pointing to /', () => {
    render(<ProjectError error={mockError} reset={mockReset} />);
    const link = screen.getByText('Dashboard').closest('a');
    expect(link).toHaveAttribute('href', '/');
  });

  it('logs error to console', () => {
    render(<ProjectError error={mockError} reset={mockReset} />);
    expect(console.error).toHaveBeenCalledWith('Project detail error:', mockError);
  });
});
