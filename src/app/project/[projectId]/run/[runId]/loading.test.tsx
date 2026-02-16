import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/components/run-detail-skeleton', () => ({
  RunDetailSkeleton: () => <div data-testid="run-detail-skeleton" />,
}));

import Loading from './loading';

describe('Run Detail Loading', () => {
  it('renders RunDetailSkeleton', () => {
    const { getByTestId } = render(<Loading />);
    expect(getByTestId('run-detail-skeleton')).toBeDefined();
  });
});
