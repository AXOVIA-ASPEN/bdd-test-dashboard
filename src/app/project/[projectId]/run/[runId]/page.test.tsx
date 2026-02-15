import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the client component
vi.mock('./client', () => ({
  default: ({ projectId, runId }: { projectId: string; runId: string }) => (
    <div data-testid="run-client">{projectId}/{runId}</div>
  ),
}));

import RunPage, { generateStaticParams } from './page';

describe('RunPage', () => {
  it('renders RunClient with resolved projectId and runId', async () => {
    const params = Promise.resolve({ projectId: 'docmind', runId: 'run-123' });
    const jsx = await RunPage({ params });
    render(jsx);
    expect(screen.getByTestId('run-client')).toHaveTextContent('docmind/run-123');
  });

  it('passes different params correctly', async () => {
    const params = Promise.resolve({ projectId: 'flipper-ai', runId: 'run-456' });
    const jsx = await RunPage({ params });
    render(jsx);
    expect(screen.getByTestId('run-client')).toHaveTextContent('flipper-ai/run-456');
  });
});

describe('generateStaticParams', () => {
  it('returns expected static params', () => {
    const params = generateStaticParams();
    expect(params).toEqual([
      { projectId: 'docmind', runId: 'placeholder' },
      { projectId: 'flipper-ai', runId: 'placeholder' },
      { projectId: 'real-random-portal', runId: 'placeholder' },
      { projectId: 'bdd-test-dashboard', runId: 'placeholder' },
    ]);
  });

  it('returns objects with both projectId and runId', () => {
    const params = generateStaticParams();
    expect(params.length).toBe(4);
    params.forEach((p) => {
      expect(p).toHaveProperty('projectId');
      expect(p).toHaveProperty('runId');
    });
  });
});
