import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ToastContainer } from './toast';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { act } from 'react';

describe('ToastContainer', () => {
  beforeEach(() => {
    act(() => {
      useDashboardStore.setState({ toasts: [] });
    });
  });

  it('renders no toasts when toasts array is empty', () => {
    render(<ToastContainer />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders a success toast', () => {
    const toast = { id: '1', type: 'success' as const, message: 'Test success' };
    act(() => {
      useDashboardStore.setState({ toasts: [toast] });
    });
    render(<ToastContainer />);
    expect(screen.getByText('Test success')).toBeInTheDocument();
  });

  it('renders an error toast', () => {
    const toast = { id: '2', type: 'error' as const, message: 'Test error' };
    act(() => {
      useDashboardStore.setState({ toasts: [toast] });
    });
    render(<ToastContainer />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders an info toast', () => {
    const toast = { id: '3', type: 'info' as const, message: 'Test info' };
    act(() => {
      useDashboardStore.setState({ toasts: [toast] });
    });
    render(<ToastContainer />);
    expect(screen.getByText('Test info')).toBeInTheDocument();
  });

  it('shows max 3 toasts', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Toast 1' },
      { id: '2', type: 'success' as const, message: 'Toast 2' },
      { id: '3', type: 'success' as const, message: 'Toast 3' },
      { id: '4', type: 'success' as const, message: 'Toast 4' },
    ];
    act(() => {
      useDashboardStore.setState({ toasts });
    });
    render(<ToastContainer />);
    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
    expect(screen.queryByText('Toast 4')).not.toBeInTheDocument();
  });

  it('removes toast when X button is clicked', async () => {
    const toast = { id: '1', type: 'success' as const, message: 'Test toast' };
    act(() => {
      useDashboardStore.setState({ toasts: [toast] });
    });
    render(<ToastContainer />);
    
    const dismissButton = screen.getByRole('button', { name: 'Dismiss notification' });
    await userEvent.click(dismissButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Test toast')).not.toBeInTheDocument();
    });
  });

  it('auto-dismisses toast after 4 seconds', async () => {
    const toast = { id: '1', type: 'success' as const, message: 'Auto dismiss test' };
    act(() => {
      useDashboardStore.setState({ toasts: [toast] });
    });
    render(<ToastContainer />);
    
    expect(screen.getByText('Auto dismiss test')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Auto dismiss test')).not.toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('has accessible attributes', () => {
    const toast = { id: '1', type: 'info' as const, message: 'Accessible toast' };
    act(() => {
      useDashboardStore.setState({ toasts: [toast] });
    });
    render(<ToastContainer />);
    
    const toastElement = screen.getByRole('status');
    expect(toastElement).toHaveAttribute('aria-live', 'polite');
  });
});
