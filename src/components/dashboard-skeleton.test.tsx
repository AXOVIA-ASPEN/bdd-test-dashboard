import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DashboardSkeleton } from './dashboard-skeleton';

describe('DashboardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders 4 summary card skeletons', () => {
    const { container } = render(<DashboardSkeleton />);
    // First grid has 4 card placeholders
    const grid = container.querySelector('.grid-cols-2');
    expect(grid).toBeTruthy();
    expect(grid!.children.length).toBe(4);
  });

  it('renders trend chart skeleton area', () => {
    const { container } = render(<DashboardSkeleton />);
    // Trend chart area has h-48 skeleton
    const tallSkeleton = container.querySelector('.h-48');
    expect(tallSkeleton).toBeTruthy();
  });

  it('renders 3 project card skeletons', () => {
    const { container } = render(<DashboardSkeleton />);
    const projectGrid = container.querySelector('.grid-cols-1');
    expect(projectGrid).toBeTruthy();
    expect(projectGrid!.children.length).toBe(3);
  });
});
