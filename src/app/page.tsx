'use client';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { SummaryCards } from '@/components/summary-cards';
import { TrendChart } from '@/components/trend-chart';
import { ProjectCards } from '@/components/project-cards';
import { RecentRuns } from '@/components/recent-runs';
import { DashboardSkeleton } from '@/components/dashboard-skeleton';
import { ErrorState } from '@/components/error-state';

export default function Home() {
  const loading = useDashboardStore(s => s.loading);
  const projects = useDashboardStore(s => s.projects);
  const error = useDashboardStore(s => s.error);
  const retry = useDashboardStore(s => s.retry);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-20 text-muted">
        <p className="text-lg font-semibold mb-2">No projects configured</p>
        <p className="text-sm">Add projects to the Firestore <code className="bg-card-border px-1.5 py-0.5 rounded">projects</code> collection to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SummaryCards />
      <TrendChart />
      <ProjectCards />
      <RecentRuns />
    </div>
  );
}
