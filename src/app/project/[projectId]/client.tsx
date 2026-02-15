'use client';
import { useMemo, useState } from 'react';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { motion } from 'framer-motion';
import { formatDate, formatTime, formatDuration, statusBg } from '@/lib/utils';
import Link from 'next/link';
import { ProjectSkeleton } from '@/components/project-skeleton';
import { RunTestsDialog } from '@/components/run-tests-dialog';
import { AlertTriangle, ArrowLeft, ChevronRight, Loader2, Play, RefreshCw } from 'lucide-react';
import { ProjectTrendChart } from '@/components/project-trend-chart';

export default function ProjectClient({ projectId }: { projectId: string }) {
  const project = useDashboardStore(s => s.getProject(projectId));
  const allRuns = useDashboardStore(s => s.runs);
  const runs = useMemo(() => allRuns.filter(r => r.projectId === projectId), [allRuns, projectId]);
  const loading = useDashboardStore(s => s.loading);
  const error = useDashboardStore(s => s.error);
  const retry = useDashboardStore(s => s.retry);
  const [runDialogOpen, setRunDialogOpen] = useState(false);

  if (loading) {
    return <ProjectSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md w-full text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto" />
          <p className="text-lg font-semibold text-red-600 dark:text-red-400">Failed to load data</p>
          <p className="text-sm text-muted">{error}</p>
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 text-muted">
        <p>Project not found.</p>
        <Link href="/" className="text-accent mt-2 inline-block">Back to dashboard</Link>
      </div>
    );
  }

  const latestRun = runs[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-card-border/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
              <h2 className="text-2xl font-bold">{project.name}</h2>
            </div>
            <p className="text-sm text-muted">{project.description}</p>
          </div>
        </div>
        <button
          onClick={() => setRunDialogOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg transition-colors text-sm font-medium"
        >
          <Play className="w-4 h-4" />
          Run Tests
        </button>
      </div>

      <RunTestsDialog
        project={project}
        open={runDialogOpen}
        onClose={() => setRunDialogOpen(false)}
        onTriggered={() => {}}
      />

      {latestRun && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: latestRun.summary?.total ?? 0, color: 'text-accent' },
            { label: 'Passed', value: latestRun.summary?.passed ?? 0, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Failed', value: latestRun.summary?.failed ?? 0, color: 'text-red-600 dark:text-red-400' },
            { label: 'Skipped', value: latestRun.summary?.skipped ?? 0, color: 'text-yellow-600 dark:text-yellow-400' },
          ].map(c => (
            <div key={c.label} className="bg-card border border-card-border rounded-xl p-4 text-center">
              <p className="text-sm text-muted">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </motion.div>
      )}

      <ProjectTrendChart runs={runs} />

      <div>
        <h3 className="text-lg font-semibold mb-4">Run History</h3>
        <div className="bg-card border border-card-border rounded-xl overflow-hidden divide-y divide-card-border">
          {runs.length === 0 && (
            <div className="px-5 py-8 text-center text-muted text-sm">
              No test runs yet for this project.
            </div>
          )}
          {runs.map((run) => {
            const overallStatus = run.status || (run.summary?.failed > 0 ? 'failed' : run.summary?.skipped > 0 ? 'skipped' : 'passed');
            return (
              <Link
                key={run.id}
                href={'/project/' + projectId + '/run/' + run.id + '/'}
                className="flex items-center justify-between px-5 py-3 hover:bg-card-border/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{formatDate(run.timestamp)} at {formatTime(run.timestamp)}</p>
                  <p className="text-xs text-muted">
                    {run.environment && (run.environment + ' · ')}{run.branch} · {formatDuration(run.duration)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">{run.summary?.passed ?? 0}/{run.summary?.total ?? 0}</span>
                  <span className={'text-xs px-2 py-0.5 rounded-full border ' + statusBg(overallStatus)}>{overallStatus}</span>
                  <ChevronRight className="w-4 h-4 text-muted" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
