import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RootLayout from './layout';

// Mock child components
vi.mock('@/components/header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));
vi.mock('@/components/theme-provider', () => ({
  ThemeProvider: ({ children }: any) => <div data-testid="theme-provider">{children}</div>,
}));
vi.mock('@/components/data-provider', () => ({
  DataProvider: ({ children }: any) => <div data-testid="data-provider">{children}</div>,
}));
vi.mock('@/components/error-boundary', () => ({
  ErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));

describe('RootLayout', () => {
  it('renders children inside providers', () => {
    // RootLayout returns <html> which can't be rendered inside a div,
    // so we test the component structure by checking the output
    const { container } = render(
      <RootLayout><p>Hello</p></RootLayout>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('data-provider')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders skip-to-content link', () => {
    render(<RootLayout><p>Content</p></RootLayout>);
    expect(screen.getByText('Skip to content')).toBeInTheDocument();
  });

  it('renders main element with correct id', () => {
    render(<RootLayout><p>Content</p></RootLayout>);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('nests providers in correct order: ErrorBoundary > ThemeProvider > DataProvider', () => {
    render(<RootLayout><p>Test</p></RootLayout>);
    const errorBoundary = screen.getByTestId('error-boundary');
    const themeProvider = screen.getByTestId('theme-provider');
    const dataProvider = screen.getByTestId('data-provider');
    expect(errorBoundary).toContainElement(themeProvider);
    expect(themeProvider).toContainElement(dataProvider);
  });
});
