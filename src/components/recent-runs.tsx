'use client';
import { motion } from 'framer-motion';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { formatDate, formatTime, statusBg } from '@/lib/utils';
import Link from 'next/link';

export function RecentRuns() {
  const runs = useDashboardStore(s => s.runs).slice(0, 10);
  const projects = useDashboardStore(s => s.projects);

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
    </div>
  );
}
