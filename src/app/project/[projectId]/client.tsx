'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { motion } from 'framer-motion';
import { formatDate, formatTime, formatDuration, statusBg, generateCsv, downloadCsv, deriveRunStatus } from '@/lib/utils';
import Link from 'next/link';
import { ProjectSkeleton } from '@/components/project-skeleton';
import { RunTestsDialog } from '@/components/run-tests-dialog';
import { ArrowUpDown, ChevronRight, Download, Filter, Play, Search } from 'lucide-react';
import { ErrorState } from '@/components/error-state';
import { ProjectTrendChart } from '@/components/project-trend-chart';
import { Breadcrumb } from '@/components/breadcrumb';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useRouter } from 'next/navigation';

const STATUS_OPTIONS = ['all', 'passed', 'failed', 'skipped'] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

type SortBy =
  | 'date-desc'
  | 'date-asc'
  | 'rate-desc'
  | 'rate-asc'
  | 'duration-asc'
  | 'duration-desc';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'date-desc', label: 'Date (newest first)' },
  { value: 'date-asc', label: 'Date (oldest first)' },
  { value: 'rate-desc', label: 'Pass rate (high → low)' },
  { value: 'rate-asc', label: 'Pass rate (low → high)' },
  { value: 'duration-asc', label: 'Duration (shortest)' },
  { value: 'duration-desc', label: 'Duration (longest)' },
];

function getPassRate(run: { summary?: { passed?: number; total?: number } }): number {
  const total = run.summary?.total ?? 0;
  const passed = run.summary?.passed ?? 0;
  if (total === 0) return 0;
  return passed / total;
}

export default function ProjectClient({ projectId }: { projectId: string }) {
  const project = useDashboardStore(s => s.getProject(projectId));
  const allRuns = useDashboardStore(s => s.runs);
  const projectRuns = useMemo(() => allRuns.filter(r => r.projectId === projectId), [allRuns, projectId]);
  const loading = useDashboardStore(s => s.loading);
  const error = useDashboardStore(s => s.error);
  const retry = useDashboardStore(s => s.retry);
  const router = useRouter();
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [branchFilter, setBranchFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('date-desc');
  const [visibleCount, setVisibleCount] = useState(10);

  // Register keyboard shortcuts
  useKeyboardShortcuts([
    { key: '/', handler: () => setShowFilters(f => !f) },
    { key: 'Escape', handler: () => { setShowFilters(false); setShowSort(false); } },
    { key: 'Backspace', handler: () => router.push('/') },
    { key: 'ArrowLeft', alt: true, handler: () => router.push('/') },
  ]);

  useEffect(() => {
    document.title = project ? `${project.name} | BDD Dashboard` : 'BDD Dashboard';
    return () => { document.title = 'Silverline | Acceptance Test Dashboard'; };
  }, [project]);

  const branches = useMemo(() => [...new Set(projectRuns.map(r => r.branch).filter(Boolean))].sort(), [projectRuns]);

  const runs = useMemo(() => {
    const filtered = projectRuns.filter(run => {
      if (statusFilter !== 'all') {
        const s = deriveRunStatus(run);
        if (s !== statusFilter) return false;
      }
      if (branchFilter && run.branch !== branchFilter) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'date-asc':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'rate-desc':
          return getPassRate(b) - getPassRate(a);
        case 'rate-asc':
          return getPassRate(a) - getPassRate(b);
        case 'duration-asc':
          return (a.duration ?? 0) - (b.duration ?? 0);
        case 'duration-desc':
          return (b.duration ?? 0) - (a.duration ?? 0);
        default:
          return 0;
      }
    });
  }, [projectRuns, statusFilter, branchFilter, sortBy]);

  const handleExportCsv = useCallback(() => {
    if (!project || runs.length === 0) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const safeName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const filename = `${safeName}-runs-${dateStr}.csv`;
    const content = generateCsv(runs, project.name);
    downloadCsv(content, filename);
  }, [project, runs]);

  if (loading) {
    return <ProjectSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
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
  const isFiltered = statusFilter !== 'all' || !!branchFilter;
  const isSorted = sortBy !== 'date-desc';

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: project.name }]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-2">
            {/* Sort button */}
            <div className="relative">
              <button
                onClick={() => { setShowSort(s => !s); setShowFilters(false); }}
                aria-label="Toggle sort"
                aria-expanded={showSort}
                className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' + (showSort || isSorted ? 'bg-accent/20 text-accent' : 'bg-card-border/50 text-muted hover:text-foreground')}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort
                {isSorted && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-accent" />
                )}
              </button>

              {showSort && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-20 w-52 bg-card border border-card-border rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-card-border flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">Sort by</span>
                    {isSorted && (
                      <button
                        onClick={() => { setSortBy('date-desc'); setVisibleCount(10); }}
                        className="text-xs text-accent hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setShowSort(false); setVisibleCount(10); }}
                      className={'w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ' + (sortBy === opt.value ? 'bg-accent/10 text-accent font-medium' : 'text-foreground hover:bg-card-border/40')}
                    >
                      {opt.label}
                      {sortBy === opt.value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Filter button */}
            <button
              onClick={() => { setShowFilters(f => !f); setShowSort(false); }}
              aria-label="Toggle filters"
              aria-expanded={showFilters}
              className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' + (showFilters || isFiltered ? 'bg-accent/20 text-accent' : 'bg-card-border/50 text-muted hover:text-foreground')}
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
              {isFiltered && (
                <span className="ml-1 w-2 h-2 rounded-full bg-accent" />
              )}
            </button>

            {/* Export CSV button */}
            <button
              onClick={handleExportCsv}
              disabled={runs.length === 0}
              aria-label="Export runs as CSV"
              title={runs.length === 0 ? 'No runs to export' : `Export ${runs.length} run${runs.length === 1 ? '' : 's'} as CSV`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-card-border/50 text-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-4 bg-card border border-card-border rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">Filters</span>
              {isFiltered && (
                <button onClick={() => { setStatusFilter('all'); setBranchFilter(''); setVisibleCount(10); }} className="text-xs text-accent hover:underline">Clear all</button>
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
                    onClick={() => { setStatusFilter(s); setVisibleCount(10); }}
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
                  onChange={e => { setBranchFilter(e.target.value); setVisibleCount(10); }}
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
              {isFiltered ? (
                <div className="space-y-2">
                  <p>No runs match the current filters.</p>
                  <button onClick={() => { setStatusFilter('all'); setBranchFilter(''); }} className="text-accent hover:underline text-xs">Clear filters</button>
                </div>
              ) : (
                <p>No test runs yet for this project.</p>
              )}
            </div>
          )}
          {runs.slice(0, visibleCount).map((run, index) => {
            const overallStatus = deriveRunStatus(run);
            return (
              <motion.div
                key={run.id}
                initial={index >= visibleCount - 10 && visibleCount > 10 ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index >= visibleCount - 10 && visibleCount > 10 ? (index - (visibleCount - 10)) * 0.03 : 0 }}
              >
                <Link
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
              </motion.div>
            );
          })}
        </div>
        {runs.length > 0 && (
          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-xs text-muted">
              Showing {Math.min(visibleCount, runs.length)} of {runs.length} runs
            </p>
            {visibleCount < runs.length && (
              <button
                onClick={() => setVisibleCount(c => c + 10)}
                className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
              >
                Show More
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
