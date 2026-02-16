'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { Activity, CheckCircle2, XCircle, SkipForward } from 'lucide-react';
import { Skeleton } from './skeleton';

const cardDefs = [
  { key: 'total' as const, label: 'Total Tests', icon: Activity, color: 'text-accent', suffix: '' },
  { key: 'passRate' as const, label: 'Pass Rate', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', suffix: '%' },
  { key: 'failed' as const, label: 'Failures', icon: XCircle, color: 'text-red-600 dark:text-red-400', suffix: '' },
  { key: 'skipped' as const, label: 'Skipped', icon: SkipForward, color: 'text-yellow-600 dark:text-yellow-400', suffix: '' },
];

export function SummaryCards() {
  const loading = useDashboardStore(s => s.loading);
  const projects = useDashboardStore(s => s.projects);
  const runs = useDashboardStore(s => s.runs);

  const { summary, deltas } = useMemo(() => {
    // Get latest (index 0) and previous (index 1) runs per project
    const latestRuns: typeof runs = [];
    const previousRuns: typeof runs = [];
    for (const p of projects) {
      const projectRuns = runs.filter(r => r.projectId === p.id);
      if (projectRuns[0]) latestRuns.push(projectRuns[0]);
      if (projectRuns[1]) previousRuns.push(projectRuns[1]);
    }

    const aggregate = (list: typeof runs) =>
      list.reduce((acc, r) => ({
        passed: acc.passed + (r.summary?.passed || 0),
        failed: acc.failed + (r.summary?.failed || 0),
        skipped: acc.skipped + (r.summary?.skipped || 0),
        total: acc.total + (r.summary?.total || 0),
      }), { passed: 0, failed: 0, skipped: 0, total: 0 });

    const curr = aggregate(latestRuns);
    const prev = aggregate(previousRuns);
    const currPassRate = curr.total > 0 ? Math.round((curr.passed / curr.total) * 100) : 0;
    const prevPassRate = prev.total > 0 ? Math.round((prev.passed / prev.total) * 100) : 0;

    const hasPrev = previousRuns.length > 0;

    const computeDelta = (current: number, previous: number, invertedIsBetter: boolean) => {
      if (!hasPrev) return null;
      const diff = current - previous;
      if (diff === 0) return { value: 0, direction: 'unchanged' as const };
      // For inverted metrics (failures, skipped): going DOWN is good
      const isGood = invertedIsBetter ? diff < 0 : diff > 0;
      return { value: diff, direction: isGood ? ('improving' as const) : ('regressing' as const) };
    };

    return {
      summary: { ...curr, passRate: currPassRate },
      deltas: {
        total: computeDelta(curr.total, prev.total, false),
        passRate: computeDelta(currPassRate, prevPassRate, false),
        failed: computeDelta(curr.failed, prev.failed, true),
        skipped: computeDelta(curr.skipped, prev.skipped, true),
      } as Record<string, { value: number; direction: 'improving' | 'regressing' | 'unchanged' } | null>,
    };
  }, [projects, runs]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-5 rounded-md" />
            </div>
            <Skeleton className="h-9 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cardDefs.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-card border border-card-border rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted">{card.label}</span>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">
              {summary[card.key]}{card.suffix}
            </p>
            {deltas[card.key] && (
              <span className={`text-xs font-medium ${
                deltas[card.key]!.direction === 'improving'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : deltas[card.key]!.direction === 'regressing'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted'
              }`}>
                {deltas[card.key]!.direction === 'unchanged'
                  ? '—'
                  : `${deltas[card.key]!.value > 0 ? '↑' : '↓'} ${Math.abs(deltas[card.key]!.value)}${card.suffix}`
                }
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
