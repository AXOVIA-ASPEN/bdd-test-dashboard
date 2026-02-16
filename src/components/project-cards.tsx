'use client';
import { motion } from 'framer-motion';
import { useDashboardStore } from '@/store/use-dashboard-store';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { Sparkline } from './sparkline';
import { Skeleton } from './skeleton';

export function ProjectCards() {
  const loading = useDashboardStore(s => s.loading);
  const projects = useDashboardStore(s => s.projects);
  const runs = useDashboardStore(s => s.runs);

  if (loading) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Projects</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Skeleton className="flex-1 h-2 rounded-full" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Projects</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {projects.map((p, i) => {
          const latestRun = runs.find(r => r.projectId === p.id);
          const rate = latestRun?.summary?.total
            ? Math.round((latestRun.summary.passed / latestRun.summary.total) * 100)
            : 0;

          // Duration sparkline: last 10 runs for this project
          const projectRuns = runs
            .filter(r => r.projectId === p.id)
            .slice(0, 10)
            .reverse();
          const durationData = projectRuns.map(r => r.duration);

          // Health badge logic
          let healthBadge = { icon: '⏳', label: 'No runs', color: 'bg-gray-500/15 text-gray-500' };
          if (latestRun) {
            const { failed, skipped, passed, total } = latestRun.summary;
            if (failed > 0) {
              healthBadge = { icon: '❌', label: 'Failing', color: 'bg-red-500/15 text-red-600 dark:text-red-400' };
            } else if (skipped > 0) {
              healthBadge = { icon: '⚠️', label: 'Flaky', color: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' };
            } else if (passed === total && total > 0) {
              healthBadge = { icon: '✅', label: 'Passing', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' };
            }
          }
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <Link
                href={`/project/${p.id}/`}
                className="block bg-card border border-card-border rounded-xl p-5 hover:border-accent/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                      <h4 className="font-semibold">{p.name}</h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${healthBadge.color}`}>
                        <span>{healthBadge.icon}</span> {healthBadge.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted">{p.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted group-hover:text-accent transition-colors" />
                </div>
                {latestRun ? (
                  <>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-emerald-600 dark:text-emerald-400">{latestRun.summary.passed} passed</span>
                      <span className="text-red-600 dark:text-red-400">{latestRun.summary.failed} failed</span>
                      <span className="text-yellow-600 dark:text-yellow-400">{latestRun.summary.skipped} skipped</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-card-border rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${rate}%` }} />
                      </div>
                      <span className="text-xs font-medium text-muted">{rate}%</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-muted">Last run: {formatRelativeTime(latestRun.timestamp)}</p>
                      {durationData.length >= 2 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted">Duration</span>
                          <Sparkline data={durationData} width={64} height={20} color={p.color || '#10b981'} />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted">No runs yet</p>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
