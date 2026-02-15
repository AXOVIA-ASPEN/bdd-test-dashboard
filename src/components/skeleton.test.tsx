import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('renders a div with pulse animation', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el.className).toContain('animate-pulse');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-9 w-9 rounded-full" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('h-9');
    expect(el.className).toContain('w-9');
    expect(el.className).toContain('rounded-full');
  });

  it('includes base bg class', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('bg-card-border/50');
  });
});
