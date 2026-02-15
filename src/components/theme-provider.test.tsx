import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from './theme-provider';
import { useDashboardStore } from '@/store/use-dashboard-store';

describe('ThemeProvider', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    useDashboardStore.setState({ theme: 'light' });
  });

  it('renders children', () => {
    const { getByText } = render(
      <ThemeProvider><span>Hello</span></ThemeProvider>
    );
    expect(getByText('Hello')).toBeInTheDocument();
  });

  it('adds dark class when theme is dark', () => {
    useDashboardStore.setState({ theme: 'dark' });
    render(<ThemeProvider><span>Test</span></ThemeProvider>);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class when theme is light', () => {
    document.documentElement.classList.add('dark');
    useDashboardStore.setState({ theme: 'light' });
    render(<ThemeProvider><span>Test</span></ThemeProvider>);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
