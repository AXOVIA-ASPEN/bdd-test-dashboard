'use client';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { motion } from 'framer-motion';
import { formatDate, formatTime, formatDuration, statusBg, statusColor } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export default function ProjectClient({ projectId }: { projectId: string }) {
  const project = useDashboardStore(s => s.getProject(projectId));
  if (!project) return <div className="text-center py-20 text-muted">Project not found</div>;

  const latestRun = project.runs[project.runs.length - 1];

  return (
    <div className="space-y-6">
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

      {latestRun && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: latestRun.summary.total, color: 'text-accent' },
            { label: 'Passed', value: latestRun.summary.passed, color: 'text-emerald-400' },
            { label: 'Failed', value: latestRun.summary.failed, color: 'text-red-400' },
            { label: 'Skipped', value: latestRun.summary.skipped, color: 'text-yellow-400' },
          ].map(c => (
            <div key={c.label} className="bg-card border border-card-border rounded-xl p-4 text-center">
              <p className="text-sm text-muted">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </motion.div>
      )}

      {latestRun && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Latest Run — Features</h3>
          {latestRun.features.map((feature, fi) => {
            const passed = feature.scenarios.filter(s => s.status === 'passed').length;
            const total = feature.scenarios.length;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: fi * 0.1 }}
                className="bg-card border border-card-border rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{feature.name}</h4>
                  <span className="text-sm text-muted">{passed}/{total} passed</span>
                </div>
                <p className="text-sm text-muted mb-4">{feature.description}</p>
                <div className="space-y-2">
                  {feature.scenarios.map(scenario => (
                    <div key={scenario.id} className="border border-card-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{scenario.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBg(scenario.status)}`}>{scenario.status}</span>
                      </div>
                      <div className="space-y-1 ml-2">
                        {scenario.steps.map((step, si) => (
                          <div key={si} className="flex items-start gap-2 text-xs">
                            <span className="text-accent font-mono w-12 shrink-0">{step.keyword}</span>
                            <span className={statusColor(step.status)}>{step.text}</span>
                            <span className="text-muted ml-auto shrink-0">{step.duration}ms</span>
                          </div>
                        ))}
                        {scenario.steps.find(s => s.error) && (
                          <div className="mt-1 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 font-mono">
                            {scenario.steps.find(s => s.error)!.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Run History</h3>
        <div className="bg-card border border-card-border rounded-xl overflow-hidden divide-y divide-card-border">
          {project.runs.slice().reverse().map((run) => {
            const overallStatus = run.summary.failed > 0 ? 'failed' : run.summary.skipped > 0 ? 'skipped' : 'passed';
            return (
              <Link
                key={run.id}
                href={`/project/${project.id}/run/${run.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-card-border/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{formatDate(run.timestamp)} at {formatTime(run.timestamp)}</p>
                  <p className="text-xs text-muted">{run.environment} · {run.branch} · {formatDuration(run.duration)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">{run.summary.passed}/{run.summary.total}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBg(overallStatus)}`}>{overallStatus}</span>
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
