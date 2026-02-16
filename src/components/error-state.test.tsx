import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from './error-state';

describe('ErrorState', () => {
  it('renders default title and message', () => {
    render(<ErrorState message="Something went wrong" />);
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<ErrorState message="Oops" title="Custom Error" />);
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('renders retry button when onRetry provided', () => {
    const onRetry = jest.fn();
    render(<ErrorState message="err" onRetry={onRetry} />);
    const btn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry omitted', () => {
    render(<ErrorState message="err" />);
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });
});
