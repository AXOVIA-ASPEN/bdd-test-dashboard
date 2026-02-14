'use client';
import { useState } from 'react';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, formatTime, formatDuration, statusBg, statusColor } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronRight, Clock, GitBranch, Server } from 'lucide-react';

export default function RunClient({ projectId, runId }: { projectId: string; runId: string }) {
  const project = useDashboardStore(s => s.getProject(projectId));
  const run = useDashboardStore(s => s.getRun(projectId, runId));
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  if (!project || !run) return <div className="text-center py-20 text-muted">Run not found</div>;

  const toggleError = (id: string) => {
    setExpandedErrors(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const overallStatus = run.summary.failed > 0 ? 'failed' : run.summary.skipped > 0 ? 'skipped' : 'passed';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/project/${projectId}`} className="p-2 rounded-lg hover:bg-card-border/50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
            <h2 className="text-2xl font-bold">{project.name}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBg(overallStatus)}`}>{overallStatus}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted mt-1">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(run.timestamp)} at {formatTime(run.timestamp)}</span>
            <span className="flex items-center gap-1"><Server className="w-3.5 h-3.5" />{run.environment}</span>
            <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" />{run.branch}</span>
            <span>{formatDuration(run.duration)}</span>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: run.summary.total, color: 'text-accent' },
          { label: 'Passed', value: run.summary.passed, color: 'text-emerald-400' },
          { label: 'Failed', value: run.summary.failed, color: 'text-red-400' },
          { label: 'Skipped', value: run.summary.skipped, color: 'text-yellow-400' },
        ].map(c => (
          <div key={c.label} className="bg-card border border-card-border rounded-xl p-4 text-center">
            <p className="text-sm text-muted">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </motion.div>

      {run.features.map((feature, fi) => (
        <motion.div
          key={feature.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: fi * 0.1 }}
          className="bg-card border border-card-border rounded-xl p-5"
        >
          <h3 className="font-semibold text-lg mb-1">{feature.name}</h3>
          <p className="text-sm text-muted mb-4">{feature.description}</p>
          <div className="space-y-3">
            {feature.scenarios.map(scenario => {
              const hasError = scenario.steps.some(s => s.error);
              const isExpanded = expandedErrors.has(scenario.id);
              return (
                <div key={scenario.id} className="border border-card-border rounded-lg overflow-hidden">
                  <div
                    className={`flex items-center justify-between px-4 py-3 ${hasError ? 'cursor-pointer hover:bg-card-border/30' : ''}`}
                    onClick={() => hasError && toggleError(scenario.id)}
                  >
                    <div className="flex items-center gap-2">
                      {hasError && (isExpanded ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />)}
                      <span className="text-sm font-medium">{scenario.name}</span>
                      <div className="flex gap-1 ml-2">
                        {scenario.tags.map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-card-border text-muted">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted">{formatDuration(scenario.duration)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBg(scenario.status)}`}>{scenario.status}</span>
                    </div>
                  </div>
                  <div className="px-4 pb-3 space-y-1 border-t border-card-border pt-2">
                    {scenario.steps.map((step, si) => (
                      <div key={si} className="flex items-start gap-2 text-xs">
                        <span className="text-accent font-mono w-12 shrink-0 font-semibold">{step.keyword}</span>
                        <span className={statusColor(step.status)}>{step.text}</span>
                        <span className="text-muted ml-auto shrink-0">{step.duration}ms</span>
                      </div>
                    ))}
                  </div>
                  <AnimatePresence>
                    {hasError && isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3">
                          {scenario.steps.filter(s => s.error).map((s, ei) => (
                            <div key={ei} className="p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 font-mono whitespace-pre-wrap">
                              ❌ {s.keyword} {s.text}{'\n'}{s.error}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
