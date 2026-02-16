import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useDashboardStore } from '@/store/use-dashboard-store';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => {
      const { whileTap, initial, animate, transition, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
    div: ({ children, ...props }: any) => {
      const { initial, animate, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

import { Header } from './header';

describe('Header', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      theme: 'dark',
      loading: false,
      lastFetchedAt: null,
    });
  });

  it('renders the brand name', () => {
    render(<Header />);
    expect(screen.getByText('Silverline')).toBeTruthy();
    expect(screen.getByText('Acceptance Test Dashboard')).toBeTruthy();
  });

  it('renders theme toggle button', () => {
    render(<Header />);
    expect(screen.getByLabelText('Toggle theme')).toBeTruthy();
  });

  it('renders refresh button', () => {
    render(<Header />);
    expect(screen.getByLabelText('Refresh data')).toBeTruthy();
  });

  it('calls toggleTheme when theme button clicked', () => {
    render(<Header />);
    const btn = screen.getByLabelText('Toggle theme');
    fireEvent.click(btn);
    // After toggle, theme should be 'light'
    expect(useDashboardStore.getState().theme).toBe('light');
  });

  it('calls retry when refresh button clicked', () => {
    const retrySpy = vi.fn();
    useDashboardStore.setState({ retry: retrySpy, loading: false });
    render(<Header />);
    fireEvent.click(screen.getByLabelText('Refresh data'));
    expect(retrySpy).toHaveBeenCalled();
  });

  it('disables refresh button when loading', () => {
    useDashboardStore.setState({ loading: true });
    render(<Header />);
    const btn = screen.getByLabelText('Refresh data') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('does not call retry when loading', () => {
    const retrySpy = vi.fn();
    useDashboardStore.setState({ retry: retrySpy, loading: true });
    render(<Header />);
    fireEvent.click(screen.getByLabelText('Refresh data'));
    expect(retrySpy).not.toHaveBeenCalled();
  });

  it('shows relative time when lastFetchedAt is set', () => {
    useDashboardStore.setState({ lastFetchedAt: new Date().toISOString() });
    render(<Header />);
    expect(screen.getByText(/Updated/)).toBeTruthy();
  });

  it('does not show relative time when lastFetchedAt is null', () => {
    render(<Header />);
    expect(screen.queryByText(/Updated/)).toBeNull();
  });

  it('links to home page', () => {
    render(<Header />);
    const link = screen.getByText('Silverline').closest('a');
    expect(link?.getAttribute('href')).toBe('/');
  });
});
