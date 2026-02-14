'use client';
import { useState, useEffect, useRef } from 'react';
import { useDashboardStore, type TestRun } from '@/store/use-dashboard-store';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, formatTime, formatDuration, statusBg, statusColor } from '@/lib/utils';
import { fetchRunLogs } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronRight, Clock, GitBranch, Terminal, Loader2 } from 'lucide-react';

export default function RunClient({ projectId, runId }: { projectId: string; runId: string }) {
  const { fetchProjects, fetchRunDetail, getProject } = useDashboardStore();
  const project = useDashboardStore(s => s.getProject(projectId));
  const [run, setRun] = useState<TestRun | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [logOffset, setLogOffset] = useState(0);
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [showLogs, setShowLogs] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchProjects(); }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const load = async () => {
      const data = await fetchRunDetail(runId);
      if (data) {
        setRun(data);
        if (data.status === 'pending' || data.status === 'running') {
          interval = setInterval(async () => {
            const updated = await fetchRunDetail(runId);
            if (updated) {
              setRun(updated);
              if (updated.status !== 'pending' && updated.status !== 'running') clearInterval(interval);
            }
          }, 3000);
        }
      }
    };
    load();
    return () => clearInterval(interval);
  }, [runId]);

  useEffect(() => {
    if (!run || (run.status !== 'pending' && run.status !== 'running')) return;
    const interval = setInterval(async () => {
      try {
        const data = await fetchRunLogs(runId, logOffset);
        if (data.logs.length > 0) {
          setLogs(prev => [...prev, ...data.logs]);
          setLogOffset(data.total);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [run?.status, runId, logOffset]);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const toggleError = (id: string) => {
    setExpandedErrors(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  if (!run) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading run details...
      </div>
    );
  }

  const overallStatus = run.status || (run.summary?.failed > 0 ? 'failed' : run.summary?.skipped > 0 ? 'skipped' : 'passed');
  const isActive = run.status === 'pending' || run.status === 'running';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/project/${projectId}`} className="p-2 rounded-lg hover:bg-card-border/50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project?.color }} />
            <h2 className="text-2xl font-bold">{project?.name || projectId}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBg(overallStatus)}`}>
              {isActive && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
              {overallStatus}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted mt-1">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(run.timestamp)} at {formatTime(run.timestamp)}</span>
            <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" />{run.branch}</span>
            {run.duration > 0 && <span>{formatDuration(run.duration)}</span>}
            {run.tags && run.tags.length > 0 && <span>{run.tags.join(', ')}</span>}
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: run.summary?.total ?? 0, color: 'text-accent' },
          { label: 'Passed', value: run.summary?.passed ?? 0, color: 'text-emerald-400' },
          { label: 'Failed', value: run.summary?.failed ?? 0, color: 'text-red-400' },
          { label: 'Skipped', value: run.summary?.skipped ?? 0, color: 'text-yellow-400' },
        ].map(c => (
          <div key={c.label} className="bg-card border border-card-border rounded-xl p-4 text-center">
            <p className="text-sm text-muted">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </motion.div>

      {run.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <p className="font-semibold mb-1">Error</p>
          <p className="text-sm font-mono">{run.error}</p>
        </div>
      )}

      {(isActive || logs.length > 0) && (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <button onClick={() => setShowLogs(!showLogs)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-card-border/30 transition-colors">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-accent" />
              <span className="font-semibold text-sm">Execution Logs</span>
              {isActive && <span className="text-xs text-muted animate-pulse">Live</span>}
            </div>
            {showLogs ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <AnimatePresence>
            {showLogs && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-5 pb-4 max-h-96 overflow-y-auto font-mono text-xs space-y-0.5 bg-background/50">
                  {logs.map((line, i) => <div key={i} className="text-muted whitespace-pre-wrap">{line}</div>)}
                  {logs.length === 0 && <div className="text-muted py-4">Waiting for logs...</div>}
                  <div ref={logsEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {run.features && run.features.map((feature: any, fi: number) => (
        <motion.div key={feature.id || fi} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: fi * 0.1 }} className="bg-card border border-card-border rounded-xl p-5">
          <h3 className="font-semibold text-lg mb-1">{feature.name}</h3>
          <p className="text-sm text-muted mb-4">{feature.description}</p>
          <div className="space-y-3">
            {(feature.scenarios || []).map((scenario: any, si: number) => {
              const key = `${fi}-${si}`;
              const hasError = (scenario.steps || []).some((s: any) => s.error);
              const isExpanded = expandedErrors.has(key);
              return (
                <div key={key} className="border border-card-border rounded-lg overflow-hidden">
                  <div className={`flex items-center justify-between px-4 py-3 ${hasError ? 'cursor-pointer hover:bg-card-border/30' : ''}`} onClick={() => hasError && toggleError(key)}>
                    <div className="flex items-center gap-2">
                      {hasError && (isExpanded ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />)}
                      <span className="text-sm font-medium">{scenario.name}</span>
                      <div className="flex gap-1 ml-2">
                        {(scenario.tags || []).map((t: string) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-card-border text-muted">{t}</span>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted">{formatDuration(scenario.duration || 0)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBg(scenario.status)}`}>{scenario.status}</span>
                    </div>
                  </div>
                  {(scenario.steps || []).length > 0 && (
                    <div className="px-4 pb-3 space-y-1 border-t border-card-border pt-2">
                      {scenario.steps.map((step: any, si2: number) => (
                        <div key={si2} className="flex items-start gap-2 text-xs">
                          <span className="text-accent font-mono w-12 shrink-0 font-semibold">{step.keyword}</span>
                          <span className={statusColor(step.status)}>{step.text}</span>
                          <span className="text-muted ml-auto shrink-0">{step.duration}ms</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <AnimatePresence>
                    {hasError && isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-3">
                          {(scenario.steps || []).filter((s: any) => s.error).map((s: any, ei: number) => (
                            <div key={ei} className="p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 font-mono whitespace-pre-wrap">{s.keyword} {s.text} - {s.error}</div>
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
