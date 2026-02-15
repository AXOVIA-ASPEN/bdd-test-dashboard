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
let mockTheme = 'dark';

vi.mock('@/store/use-dashboard-store', () => ({
  useDashboardStore: (selector?: any) => {
    const state = { theme: mockTheme, toggleTheme: mockToggleTheme };
    return selector ? selector(state) : state;
  },
}));

describe('Header', () => {
  beforeEach(() => {
    mockTheme = 'dark';
    mockToggleTheme.mockClear();
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
});
