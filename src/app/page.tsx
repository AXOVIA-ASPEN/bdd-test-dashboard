'use client';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { SummaryCards } from '@/components/summary-cards';
import { TrendChart } from '@/components/trend-chart';
import { ProjectCards } from '@/components/project-cards';
import { RecentRuns } from '@/components/recent-runs';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const loading = useDashboardStore(s => s.loading);
  const projects = useDashboardStore(s => s.projects);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading dashboard...
      </div>
    );
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
