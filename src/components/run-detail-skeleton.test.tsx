import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RunDetailSkeleton } from './run-detail-skeleton';

describe('RunDetailSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<RunDetailSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders back button skeleton', () => {
    const { container } = render(<RunDetailSkeleton />);
    const backBtn = container.querySelector('.h-9.w-9');
    expect(backBtn).toBeTruthy();
  });

  it('renders 4 stat card skeletons', () => {
    const { container } = render(<RunDetailSkeleton />);
    const grid = container.querySelector('.grid-cols-2');
    expect(grid).toBeTruthy();
    expect(grid!.children.length).toBe(4);
  });

  it('renders 2 scenario placeholder sections', () => {
    const { container } = render(<RunDetailSkeleton />);
    // Top-level space-y-6 > last 2 children are scenario placeholders
    const topLevel = container.firstChild as HTMLElement;
    const scenarioSections = topLevel.querySelectorAll(':scope > .bg-card.rounded-xl.p-5');
    expect(scenarioSections.length).toBe(2);
  });

  it('renders 3 test case skeletons per scenario', () => {
    const { container } = render(<RunDetailSkeleton />);
    const topLevel = container.firstChild as HTMLElement;
    const scenarioSections = topLevel.querySelectorAll(':scope > .bg-card.rounded-xl.p-5');
    // Each scenario has 3 test case placeholders (border rounded-lg p-3)
    scenarioSections.forEach((section) => {
      const testCases = section.querySelectorAll('.rounded-lg.p-3');
      expect(testCases.length).toBe(3);
    });
  });
});
