'use client';
import { motion } from 'framer-motion';
import { useDashboardStore } from '@/store/use-dashboard-store';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export function ProjectCards() {
  const projects = useDashboardStore(s => s.projects);
  const runs = useDashboardStore(s => s.runs);

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
                    </div>
                    <p className="text-sm text-muted">{p.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted group-hover:text-accent transition-colors" />
                </div>
                {latestRun ? (
                  <>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-emerald-400">{latestRun.summary.passed} passed</span>
                      <span className="text-red-400">{latestRun.summary.failed} failed</span>
                      <span className="text-yellow-400">{latestRun.summary.skipped} skipped</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-card-border rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${rate}%` }} />
                      </div>
                      <span className="text-xs font-medium text-muted">{rate}%</span>
                    </div>
                    <p className="mt-2 text-xs text-muted">Last run: {formatRelativeTime(latestRun.timestamp)}</p>
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
