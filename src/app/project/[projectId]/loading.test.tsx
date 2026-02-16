import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/components/project-skeleton', () => ({
  ProjectSkeleton: () => <div data-testid="project-skeleton" />,
}));

import Loading from './loading';

describe('Project Loading', () => {
  it('renders ProjectSkeleton', () => {
    const { getByTestId } = render(<Loading />);
    expect(getByTestId('project-skeleton')).toBeDefined();
  });
});
