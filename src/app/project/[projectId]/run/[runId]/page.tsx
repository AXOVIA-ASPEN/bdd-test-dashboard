import RunClient from './client';

export function generateStaticParams() {
  return [
    { projectId: 'docmind', runId: 'placeholder' },
    { projectId: 'flipper-ai', runId: 'placeholder' },
    { projectId: 'real-random-portal', runId: 'placeholder' },
    { projectId: 'bdd-test-dashboard', runId: 'placeholder' },
  ];
}

export default async function RunPage({ params }: { params: Promise<{ projectId: string; runId: string }> }) {
  const { projectId, runId } = await params;
  return <RunClient projectId={projectId} runId={runId} />;
}
