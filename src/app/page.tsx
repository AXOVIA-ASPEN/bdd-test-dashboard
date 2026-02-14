'use client';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { SummaryCards } from '@/components/summary-cards';
import { TrendChart } from '@/components/trend-chart';
import { ProjectCards } from '@/components/project-cards';
import { RecentRuns } from '@/components/recent-runs';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

export default function Home() {
  const loading = useDashboardStore(s => s.loading);
  const projects = useDashboardStore(s => s.projects);
  const error = useDashboardStore(s => s.error);
  const retry = useDashboardStore(s => s.retry);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md w-full text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-lg font-semibold text-red-400">Failed to load data</p>
          <p className="text-sm text-muted">{error}</p>
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
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
