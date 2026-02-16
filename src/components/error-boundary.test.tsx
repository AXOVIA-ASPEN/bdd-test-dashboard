import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './error-boundary';

let shouldThrow = false;

function ThrowingComponent() {
  if (shouldThrow) throw new Error('Test explosion');
  return <div>All good</div>;
}

describe('ErrorBoundary', () => {
  const originalError = console.error;
  beforeAll(() => { console.error = vi.fn(); });
  afterAll(() => { console.error = originalError; });

  beforeEach(() => { shouldThrow = false; });

  it('renders children when no error', () => {
    render(<ErrorBoundary><div>Child content</div></ErrorBoundary>);
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    shouldThrow = true;
    render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test explosion')).toBeInTheDocument();
  });

  it('shows Try Again and Reload Page buttons on first error', () => {
    shouldThrow = true;
    render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  });

  it('retry success: Try Again re-renders children when error is fixed', () => {
    shouldThrow = true;
    render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Fix the error, then retry
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('retry failure: Try Again still shows error UI if error persists', () => {
    shouldThrow = true;
    render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);
    // Error persists, click Try Again
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('hides Try Again after 3 retries (max-retry threshold)', () => {
    shouldThrow = true;
    render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);

    // Retry 3 times (all fail)
    for (let i = 0; i < 3; i++) {
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    }

    // After 3 retries, Try Again should be gone
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    expect(screen.getByText(/maximum retries reached/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  });

  it('calls window.location.reload on Reload Page click', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', { value: { reload: reloadMock }, writable: true });
    shouldThrow = true;
    render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);
    fireEvent.click(screen.getByRole('button', { name: /reload page/i }));
    expect(reloadMock).toHaveBeenCalled();
  });
});
