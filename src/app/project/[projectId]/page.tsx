import { projects } from '@/data/mock-data';
import ProjectClient from './client';

export function generateStaticParams() {
  return projects.map(p => ({ projectId: p.id }));
}

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <ProjectClient projectId={projectId} />;
}
