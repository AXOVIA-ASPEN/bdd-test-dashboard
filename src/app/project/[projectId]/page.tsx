import ProjectClient from './client';

export function generateStaticParams() {
  return [
    { projectId: 'docmind' },
    { projectId: 'flipper-ai' },
    { projectId: 'real-random-portal' },
  ];
}

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <ProjectClient projectId={projectId} />;
}
