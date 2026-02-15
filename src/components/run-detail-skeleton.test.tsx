import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RunDetailSkeleton } from './run-detail-skeleton';

describe('RunDetailSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<RunDetailSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders 4 stat card skeletons', () => {
    const { container } = render(<RunDetailSkeleton />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
    expect(grid!.children.length).toBe(4);
  });

  it('renders 2 scenario placeholder sections', () => {
    const { container } = render(<RunDetailSkeleton />);
    // The top-level div has: header, grid, scenario1, scenario2
    const topChildren = container.firstChild!.childNodes;
    expect(topChildren.length).toBe(4);
  });

  it('contains pulse animation elements', () => {
    const { container } = render(<RunDetailSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});
