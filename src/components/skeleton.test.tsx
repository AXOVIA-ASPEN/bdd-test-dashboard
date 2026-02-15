import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from './skeleton';
import { DashboardSkeleton } from './dashboard-skeleton';
import { ProjectSkeleton } from './project-skeleton';
import { RunDetailSkeleton } from './run-detail-skeleton';

describe('Skeleton', () => {
  it('renders a div with animate-pulse class', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el.className).toContain('animate-pulse');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('h-4');
    expect(el.className).toContain('w-20');
  });
});

describe('DashboardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders 4 summary card skeletons', () => {
    const { container } = render(<DashboardSkeleton />);
    // 4 summary cards in the first grid
    const grids = container.querySelectorAll('.grid');
    expect(grids.length).toBeGreaterThanOrEqual(1);
    expect(grids[0].children.length).toBe(4);
  });

  it('renders 3 project card skeletons', () => {
    const { container } = render(<DashboardSkeleton />);
    const grids = container.querySelectorAll('.grid');
    // Second grid has project cards
    expect(grids[1].children.length).toBe(3);
  });
});

describe('ProjectSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProjectSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders 4 stat card skeletons', () => {
    const { container } = render(<ProjectSkeleton />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
    expect(grid!.children.length).toBe(4);
  });

  it('renders 5 run history rows', () => {
    const { container } = render(<ProjectSkeleton />);
    const divider = container.querySelector('.divide-y');
    expect(divider).toBeTruthy();
    expect(divider!.children.length).toBe(5);
  });
});

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
    // The top-level space-y-6 div contains: header, grid, scenario1, scenario2
    const topDiv = container.firstChild as HTMLElement;
    const scenarioSections = topDiv.querySelectorAll(':scope > .bg-card');
    expect(scenarioSections.length).toBe(2);
  });
});
