import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the client component
vi.mock('./client', () => ({
  default: ({ projectId }: { projectId: string }) => (
    <div data-testid="project-client">{projectId}</div>
  ),
}));

import ProjectPage, { generateStaticParams } from './page';

describe('ProjectPage', () => {
  it('renders ProjectClient with resolved projectId', async () => {
    const params = Promise.resolve({ projectId: 'docmind' });
    const jsx = await ProjectPage({ params });
    render(jsx);
    expect(screen.getByTestId('project-client')).toHaveTextContent('docmind');
  });

  it('passes different projectIds correctly', async () => {
    const params = Promise.resolve({ projectId: 'flipper-ai' });
    const jsx = await ProjectPage({ params });
    render(jsx);
    expect(screen.getByTestId('project-client')).toHaveTextContent('flipper-ai');
  });
});

describe('generateStaticParams', () => {
  it('returns expected project IDs', () => {
    const params = generateStaticParams();
    expect(params).toEqual([
      { projectId: 'docmind' },
      { projectId: 'flipper-ai' },
      { projectId: 'real-random-portal' },
      { projectId: 'bdd-test-dashboard' },
    ]);
  });

  it('returns an array with projectId keys', () => {
    const params = generateStaticParams();
    expect(params.length).toBe(4);
    params.forEach((p) => {
      expect(p).toHaveProperty('projectId');
      expect(typeof p.projectId).toBe('string');
    });
  });
});
