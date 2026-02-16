import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/components/dashboard-skeleton', () => ({
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton" />,
}));

import Loading from './loading';

describe('Dashboard Loading', () => {
  it('renders DashboardSkeleton', () => {
    const { getByTestId } = render(<Loading />);
    expect(getByTestId('dashboard-skeleton')).toBeDefined();
  });
});
