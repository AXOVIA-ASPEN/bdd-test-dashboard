import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useDashboardStore } from '@/store/use-dashboard-store';
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

  it('shows seconds ago when diff is between 10-59s', () => {
    const thirtySecsAgo = new Date(Date.now() - 30_000).toISOString();
    useDashboardStore.setState({ lastFetchedAt: thirtySecsAgo });
    render(<Header />);
    expect(screen.getByText(/Updated 30s ago/)).toBeTruthy();
  });

  it('shows minutes ago when diff is between 1-59min', () => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    useDashboardStore.setState({ lastFetchedAt: fiveMinsAgo });
    render(<Header />);
    expect(screen.getByText(/Updated 5m ago/)).toBeTruthy();
  });

  it('shows hours ago when diff is 60+ minutes', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600_000).toISOString();
    useDashboardStore.setState({ lastFetchedAt: twoHoursAgo });
    render(<Header />);
    expect(screen.getByText(/Updated 2h ago/)).toBeTruthy();
  });

  it('links to home page', () => {
    render(<Header />);
    const link = screen.getByText('Silverline').closest('a');
    expect(link?.getAttribute('href')).toBe('/');
  });

  it('updates relative time on interval', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);
    useDashboardStore.setState({ lastFetchedAt: new Date(now).toISOString() });
    render(<Header />);
    expect(screen.getByText(/Updated Just now/)).toBeTruthy();

    // Advance 30 seconds + trigger interval
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByText(/Updated 30s ago/)).toBeTruthy();

    // Advance to 2 minutes total
    act(() => {
      vi.advanceTimersByTime(90_000);
    });
    expect(screen.getByText(/Updated 2m ago/)).toBeTruthy();

    vi.useRealTimers();
  });

  it('cleans up interval on unmount', () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(global, 'clearInterval');
    useDashboardStore.setState({ lastFetchedAt: new Date().toISOString() });
    const { unmount } = render(<Header />);
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
    vi.useRealTimers();
  });

  it('opens shortcuts dialog when help button is clicked', () => {
    render(<Header />);
    const helpBtn = screen.getByLabelText('Show keyboard shortcuts');
    fireEvent.click(helpBtn);
    // Dialog should be open
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('closes shortcuts dialog when close is triggered', () => {
    render(<Header />);
    const helpBtn = screen.getByLabelText('Show keyboard shortcuts');
    fireEvent.click(helpBtn);
    expect(screen.getByRole('dialog')).toBeTruthy();
    
    // Close via close button
    const closeBtn = screen.getByLabelText('Close shortcuts dialog');
    fireEvent.click(closeBtn);
    
    // Dialog should be closed (not in document)
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('toggles shortcuts dialog with ? keyboard shortcut', () => {
    render(<Header />);
    
    // Dialog should be closed initially
    expect(screen.queryByRole('dialog')).toBeNull();
    
    // Press '?' to open
    fireEvent.keyDown(document, { key: '?' });
    expect(screen.getByRole('dialog')).toBeTruthy();
    
    // Press '?' again to close
    fireEvent.keyDown(document, { key: '?' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('calls retry when r keyboard shortcut is pressed', () => {
    const retrySpy = vi.fn();
    useDashboardStore.setState({ retry: retrySpy, loading: false });
    render(<Header />);
    
    fireEvent.keyDown(document, { key: 'r' });
    expect(retrySpy).toHaveBeenCalled();
  });

  it('does not retry with r shortcut when loading', () => {
    const retrySpy = vi.fn();
    useDashboardStore.setState({ retry: retrySpy, loading: true });
    render(<Header />);
    
    fireEvent.keyDown(document, { key: 'r' });
    expect(retrySpy).not.toHaveBeenCalled();
  });

  it('toggles theme with t keyboard shortcut', () => {
    useDashboardStore.setState({ theme: 'dark' });
    render(<Header />);
    
    fireEvent.keyDown(document, { key: 't' });
    expect(useDashboardStore.getState().theme).toBe('light');
    
    fireEvent.keyDown(document, { key: 't' });
    expect(useDashboardStore.getState().theme).toBe('dark');
  });
});
