import { notFound } from 'next/navigation';
import ProjectClient from './client';

const VALID_PROJECTS = ['docmind', 'flipper-ai', 'real-random-portal', 'bdd-test-dashboard'];

export function generateStaticParams() {
  return VALID_PROJECTS.map((projectId) => ({ projectId }));
}

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!VALID_PROJECTS.includes(projectId)) {
    notFound();
  }
  return <ProjectClient projectId={projectId} />;
}
