import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProjectSkeleton } from './project-skeleton';

describe('ProjectSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProjectSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders back button skeleton', () => {
    const { container } = render(<ProjectSkeleton />);
    const backBtn = container.querySelector('.h-9.w-9');
    expect(backBtn).toBeTruthy();
  });

  it('renders 4 stat card skeletons', () => {
    const { container } = render(<ProjectSkeleton />);
    const grid = container.querySelector('.grid-cols-2');
    expect(grid).toBeTruthy();
    expect(grid!.children.length).toBe(4);
  });

  it('renders 5 run history row skeletons', () => {
    const { container } = render(<ProjectSkeleton />);
    const rows = container.querySelector('.divide-y');
    expect(rows).toBeTruthy();
    expect(rows!.children.length).toBe(5);
  });
});
