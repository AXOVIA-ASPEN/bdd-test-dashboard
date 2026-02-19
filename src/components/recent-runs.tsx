'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { formatDate, formatTime, formatDuration, statusBg, deriveRunStatus } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from './skeleton';
import { ChevronDown } from 'lucide-react';
import { TEST_IDS } from '@/lib/test-ids';

type StatusFilter = 'all' | 'passed' | 'failed' | 'skipped';

const PAGE_SIZE = 10;

export function RecentRuns() {
  const loading = useDashboardStore(s => s.loading);
  const allRuns = useDashboardStore(s => s.runs);
  const projects = useDashboardStore(s => s.projects);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const deriveStatus = (run: typeof allRuns[number]) => deriveRunStatus(run);

  const statusCounts = allRuns.reduce(
    (acc, run) => { acc[deriveStatus(run)]++; return acc; },
    { passed: 0, failed: 0, skipped: 0 } as Record<string, number>,
  );

  const filteredRuns = statusFilter === 'all' ? allRuns : allRuns.filter(run => deriveStatus(run) === statusFilter);
  const runs = filteredRuns.slice(0, visibleCount);
  const remaining = filteredRuns.length - visibleCount;
  const hasMore = remaining > 0;

  const pills: { key: StatusFilter; label: string; count: number; color: string; activeBg: string }[] = [
    { key: 'all', label: 'All', count: allRuns.length, color: 'text-accent', activeBg: 'bg-accent/15 border-accent/40' },
    { key: 'failed', label: 'Failed', count: statusCounts.failed, color: 'text-red-600 dark:text-red-400', activeBg: 'bg-red-500/15 border-red-500/40' },
    { key: 'skipped', label: 'Skipped', count: statusCounts.skipped, color: 'text-yellow-600 dark:text-yellow-400', activeBg: 'bg-yellow-500/15 border-yellow-500/40' },
    { key: 'passed', label: 'Passed', count: statusCounts.passed, color: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-500/15 border-emerald-500/40' },
  ];

  if (loading) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Test Runs</h3>
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="divide-y divide-card-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Test Runs</h3>
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {pills.map(p => (
          <button
            key={p.key}
            data-testid={TEST_IDS.RECENT_RUNS.FILTER_PILL(p.key)}
            onClick={() => { setStatusFilter(p.key); setVisibleCount(PAGE_SIZE); }}
            className={
              'text-sm px-3 py-1.5 rounded-full border transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ' +
              (statusFilter === p.key ? p.activeBg + ' ' + p.color : 'border-card-border text-muted hover:border-muted')
            }
          >
            {p.label} ({p.count})
          </button>
        ))}
      </div>
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="divide-y divide-card-border">
          {runs.length === 0 && (
            <div className="px-5 py-8 text-center text-muted text-sm">
              {statusFilter === 'all' ? 'No test runs yet. Trigger a run to see results here.' : `No ${statusFilter} runs found.`}
            </div>
          )}
          {runs.map((run, i) => {
            const proj = projects.find(p => p.id === run.projectId);
            const overallStatus = deriveStatus(run);
            return (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/project/${run.projectId}/run/${run.id}/`}
                  data-testid={TEST_IDS.RECENT_RUNS.RUN_ROW(run.id)}
                  className="flex items-center justify-between px-5 py-3 hover:bg-card-border/30 transition-colors focus-ring-inset focus-visible:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: proj?.color }} />
                    <div>
                      <span className="font-medium text-sm">{proj?.name || run.projectId}</span>
                      <p className="text-xs text-muted">
                        {formatDate(run.timestamp)} at {formatTime(run.timestamp)}
                        {run.environment && ` · ${run.environment}`}
                        {' · '}{run.branch}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">
                      {run.summary?.passed ?? 0}/{run.summary?.total ?? 0}
                      {run.duration != null && ` · ${formatDuration(run.duration)}`}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBg(overallStatus)}`}>
                      {overallStatus}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
      <AnimatePresence>
        {hasMore && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex justify-center"
          >
            <button
              onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
              data-testid={TEST_IDS.RECENT_RUNS.SHOW_MORE_BTN}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-card-border/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <ChevronDown className="w-4 h-4" />
              Show More ({remaining} remaining)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
