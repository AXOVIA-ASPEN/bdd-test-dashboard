import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardError from './error';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="alert-icon" />,
  RefreshCw: () => <span data-testid="refresh-icon" />,
  Home: () => <span data-testid="home-icon" />,
}));

describe('DashboardError', () => {
  const mockReset = vi.fn();
  const mockError = new Error('Test error message');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders error heading', () => {
    render(<DashboardError error={mockError} reset={mockReset} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays the error message', () => {
    render(<DashboardError error={mockError} reset={mockReset} />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows default message when error.message is empty', () => {
    const emptyError = new Error('');
    render(<DashboardError error={emptyError} reset={mockReset} />);
    expect(screen.getByText('An unexpected error occurred while loading the dashboard.')).toBeInTheDocument();
  });

  it('calls reset when Retry button is clicked', () => {
    render(<DashboardError error={mockError} reset={mockReset} />);
    fireEvent.click(screen.getByText('Retry'));
    expect(mockReset).toHaveBeenCalledOnce();
  });

  it('renders Home link pointing to /', () => {
    render(<DashboardError error={mockError} reset={mockReset} />);
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('logs error to console', () => {
    render(<DashboardError error={mockError} reset={mockReset} />);
    expect(console.error).toHaveBeenCalledWith('Dashboard error:', mockError);
  });
});
