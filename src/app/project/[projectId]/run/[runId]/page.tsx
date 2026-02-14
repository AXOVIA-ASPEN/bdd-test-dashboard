import { projects } from '@/data/mock-data';
import RunClient from './client';

export function generateStaticParams() {
  return projects.flatMap(p => p.runs.map(r => ({ projectId: p.id, runId: r.id })));
}

export default async function RunPage({ params }: { params: Promise<{ projectId: string; runId: string }> }) {
  const { projectId, runId } = await params;
  return <RunClient projectId={projectId} runId={runId} />;
}
