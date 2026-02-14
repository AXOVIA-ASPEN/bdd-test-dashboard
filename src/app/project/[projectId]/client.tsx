'use client';
import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { motion } from 'framer-motion';
import { formatDate, formatTime, formatDuration, statusBg } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Play } from 'lucide-react';
import { RunTestsDialog } from '@/components/run-tests-dialog';

export default function ProjectClient({ projectId }: { projectId: string }) {
  const { fetchProjects, fetchRuns } = useDashboardStore();
  const runs = useDashboardStore(s => s.runs.filter(r => r.projectId === projectId));
  const project = useDashboardStore(s => s.getProject(projectId));
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
    fetchRuns(projectId);
  }, [projectId]);

  if (!project) {
    return <div className="text-center py-20 text-muted">Loading project...</div>;
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
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/80 transition-colors"
        >
          <Play className="w-4 h-4" />
          Run Tests
        </button>
      </div>

      {latestRun && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: latestRun.summary?.total ?? 0, color: 'text-accent' },
            { label: 'Passed', value: latestRun.summary?.passed ?? 0, color: 'text-emerald-400' },
            { label: 'Failed', value: latestRun.summary?.failed ?? 0, color: 'text-red-400' },
            { label: 'Skipped', value: latestRun.summary?.skipped ?? 0, color: 'text-yellow-400' },
          ].map(c => (
            <div key={c.label} className="bg-card border border-card-border rounded-xl p-4 text-center">
              <p className="text-sm text-muted">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </motion.div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Run History</h3>
        <div className="bg-card border border-card-border rounded-xl overflow-hidden divide-y divide-card-border">
          {runs.map((run) => {
            const overallStatus = run.status || (run.summary?.failed > 0 ? 'failed' : 'passed');
            return (
              <Link
                key={run.id}
                href={`/project/${projectId}/run/${run.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-card-border/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{formatDate(run.timestamp)} at {formatTime(run.timestamp)}</p>
                  <p className="text-xs text-muted">
                    {run.branch} · {formatDuration(run.duration)}
                    {run.tags && run.tags.length > 0 && ` · ${run.tags.join(', ')}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">{run.summary?.passed ?? 0}/{run.summary?.total ?? 0}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBg(overallStatus)}`}>{overallStatus}</span>
                  <ChevronRight className="w-4 h-4 text-muted" />
                </div>
              </Link>
            );
          })}
          {runs.length === 0 && (
            <div className="px-5 py-8 text-center text-muted text-sm">
              No runs yet. Click "Run Tests" to trigger your first test run.
            </div>
          )}
        </div>
      </div>

      <RunTestsDialog
        project={project}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onTriggered={(runId) => router.push(`/project/${projectId}/run/${runId}`)}
      />
    </div>
  );
}
