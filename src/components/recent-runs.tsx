'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { formatDate, formatTime, statusBg } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from './skeleton';
import { ChevronDown } from 'lucide-react';

const PAGE_SIZE = 10;

export function RecentRuns() {
  const loading = useDashboardStore(s => s.loading);
  const allRuns = useDashboardStore(s => s.runs);
  const projects = useDashboardStore(s => s.projects);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const runs = allRuns.slice(0, visibleCount);
  const remaining = allRuns.length - visibleCount;
  const hasMore = remaining > 0;

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
      <h3 className="text-lg font-semibold mb-4">Recent Test Runs</h3>
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="divide-y divide-card-border">
          {runs.length === 0 && (
            <div className="px-5 py-8 text-center text-muted text-sm">
              No test runs yet. Trigger a run to see results here.
            </div>
          )}
          {runs.map((run, i) => {
            const proj = projects.find(p => p.id === run.projectId);
            const overallStatus = run.status || (run.summary?.failed > 0 ? 'failed' : run.summary?.skipped > 0 ? 'skipped' : 'passed');
            return (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/project/${run.projectId}/run/${run.id}/`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-card-border/30 transition-colors"
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
                    <span className="text-xs text-muted">{run.summary?.passed ?? 0}/{run.summary?.total ?? 0}</span>
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
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-card-border/30"
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
