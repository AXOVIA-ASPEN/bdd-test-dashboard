'use client';
import { useEffect, useMemo, useState } from 'react';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { motion } from 'framer-motion';
import { formatDate, formatTime, formatDuration, statusBg } from '@/lib/utils';
import Link from 'next/link';
import { ProjectSkeleton } from '@/components/project-skeleton';
import { RunTestsDialog } from '@/components/run-tests-dialog';
import { AlertTriangle, ArrowLeft, ChevronRight, Filter, Loader2, Play, RefreshCw, Search, X } from 'lucide-react';
import { ProjectTrendChart } from '@/components/project-trend-chart';

const STATUS_OPTIONS = ['all', 'passed', 'failed', 'skipped'] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

export default function ProjectClient({ projectId }: { projectId: string }) {
  const project = useDashboardStore(s => s.getProject(projectId));
  const allRuns = useDashboardStore(s => s.runs);
  const projectRuns = useMemo(() => allRuns.filter(r => r.projectId === projectId), [allRuns, projectId]);
  const loading = useDashboardStore(s => s.loading);
  const error = useDashboardStore(s => s.error);
  const retry = useDashboardStore(s => s.retry);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [branchFilter, setBranchFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    document.title = project ? `${project.name} | BDD Dashboard` : 'BDD Dashboard';
    return () => { document.title = 'Silverline | Acceptance Test Dashboard'; };
  }, [project]);

  const branches = useMemo(() => [...new Set(projectRuns.map(r => r.branch).filter(Boolean))].sort(), [projectRuns]);

  const runs = useMemo(() => {
    return projectRuns.filter(run => {
      if (statusFilter !== 'all') {
        const s = run.status || (run.summary?.failed > 0 ? 'failed' : run.summary?.skipped > 0 ? 'skipped' : 'passed');
        if (s !== statusFilter) return false;
      }
      if (branchFilter && run.branch !== branchFilter) return false;
      return true;
    });
  }, [projectRuns, statusFilter, branchFilter]);

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

  const latestRun = projectRuns[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-card-border/50 transition-colors" aria-label="Back to dashboard">
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Run History</h3>
          <button
            onClick={() => setShowFilters(f => !f)}
            aria-label="Toggle filters"
            aria-expanded={showFilters}
            className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' + (showFilters || statusFilter !== 'all' || branchFilter ? 'bg-accent/20 text-accent' : 'bg-card-border/50 text-muted hover:text-foreground')}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
            {(statusFilter !== 'all' || branchFilter) && (
              <span className="ml-1 w-2 h-2 rounded-full bg-accent" />
            )}
          </button>
        </div>

        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-4 bg-card border border-card-border rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">Filters</span>
              {(statusFilter !== 'all' || branchFilter) && (
                <button onClick={() => { setStatusFilter('all'); setBranchFilter(''); }} className="text-xs text-accent hover:underline">Clear all</button>
              )}
            </div>
            <div>
              <span id="status-filter-label" className="text-xs text-muted mb-1 block">Status</span>
              <div className="flex gap-1.5" role="radiogroup" aria-labelledby="status-filter-label">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    role="radio"
                    aria-checked={statusFilter === s}
                    onClick={() => setStatusFilter(s)}
                    className={'px-3 py-1 rounded-full text-xs font-medium border transition-colors ' + (statusFilter === s ? 'bg-accent/20 border-accent/40 text-accent' : 'border-card-border text-muted hover:text-foreground')}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="branch-filter" className="text-xs text-muted mb-1 block">Branch</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <select
                  id="branch-filter"
                  value={branchFilter}
                  onChange={e => setBranchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-transparent border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent/50"
                >
                  <option value="">All branches</option>
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </motion.div>
        )}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden divide-y divide-card-border">
          {runs.length === 0 && (
            <div className="px-5 py-8 text-center text-muted text-sm">
              {(statusFilter !== 'all' || branchFilter) ? (
                <div className="space-y-2">
                  <p>No runs match the current filters.</p>
                  <button onClick={() => { setStatusFilter('all'); setBranchFilter(''); }} className="text-accent hover:underline text-xs">Clear filters</button>
                </div>
              ) : (
                <p>No test runs yet for this project.</p>
              )}
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
