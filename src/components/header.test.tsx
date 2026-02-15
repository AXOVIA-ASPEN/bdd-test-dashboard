import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './header';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, transition, whileTap, whileHover, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, transition, whileTap, whileHover, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

const mockToggleTheme = vi.fn();
const mockRetry = vi.fn();
let mockStoreState: any = {};

vi.mock('@/store/use-dashboard-store', () => ({
  useDashboardStore: (selector?: any) => {
    const state = mockStoreState;
    return selector ? selector(state) : state;
  },
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState = {
      theme: 'dark',
      toggleTheme: mockToggleTheme,
      loading: false,
      retry: mockRetry,
      lastFetchedAt: null,
    };
  });

  it('renders the brand name and subtitle', () => {
    render(<Header />);
    expect(screen.getByText('Silverline')).toBeInTheDocument();
    expect(screen.getByText('Acceptance Test Dashboard')).toBeInTheDocument();
  });

  it('renders a link to home', () => {
    render(<Header />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders theme toggle button', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('calls toggleTheme on button click', () => {
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(mockToggleTheme).toHaveBeenCalledOnce();
  });

  it('shows Sun icon in dark mode', () => {
    mockStoreState.theme = 'dark';
    render(<Header />);
    // In dark mode the toggle should show Sun
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('shows Moon icon in light mode', () => {
    mockStoreState.theme = 'light';
    render(<Header />);
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  // useRelativeTime tests via Header rendering
  it('does not show updated time when lastFetchedAt is null', () => {
    mockStoreState.lastFetchedAt = null;
    render(<Header />);
    expect(screen.queryByText(/Updated/)).not.toBeInTheDocument();
  });

  it('shows "Just now" when fetched < 10 seconds ago', () => {
    mockStoreState.lastFetchedAt = new Date(Date.now() - 3000).toISOString();
    render(<Header />);
    expect(screen.getByText('Updated Just now')).toBeInTheDocument();
  });

  it('shows seconds ago when fetched 10-59 seconds ago', () => {
    mockStoreState.lastFetchedAt = new Date(Date.now() - 30000).toISOString();
    render(<Header />);
    expect(screen.getByText(/Updated 30s ago/)).toBeInTheDocument();
  });

  it('shows minutes ago when fetched 1-59 minutes ago', () => {
    mockStoreState.lastFetchedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    render(<Header />);
    expect(screen.getByText('Updated 5m ago')).toBeInTheDocument();
  });

  it('shows hours ago when fetched 60+ minutes ago', () => {
    mockStoreState.lastFetchedAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    render(<Header />);
    expect(screen.getByText('Updated 2h ago')).toBeInTheDocument();
  });

  // Refresh button tests
  it('calls retry when refresh button is clicked and not loading', () => {
    mockStoreState.loading = false;
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: /refresh data/i }));
    expect(mockRetry).toHaveBeenCalledOnce();
  });

  it('does not call retry when loading', () => {
    mockStoreState.loading = true;
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: /refresh data/i }));
    expect(mockRetry).not.toHaveBeenCalled();
  });

  it('disables refresh button when loading', () => {
    mockStoreState.loading = true;
    render(<Header />);
    expect(screen.getByRole('button', { name: /refresh data/i })).toBeDisabled();
  });
});
