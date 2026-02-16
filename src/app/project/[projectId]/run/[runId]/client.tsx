'use client';
import { useState, useEffect } from 'react';
import { useDashboardStore, type TestRun, type Feature } from '@/store/use-dashboard-store';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { formatDate, formatTime, formatDuration, statusBg, statusColor } from '@/lib/utils';
import Link from 'next/link';
import { RunDetailSkeleton } from '@/components/run-detail-skeleton';
import { AlertTriangle, ArrowLeft, Clock, GitBranch, Loader2, RotateCcw } from 'lucide-react';

/** Convert Firestore Timestamps to ISO strings recursively */
function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v instanceof Timestamp) {
      out[k] = v.toDate().toISOString();
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = sanitize(v as Record<string, unknown>);
    } else if (Array.isArray(v)) {
      out[k] = v.map(item =>
        item instanceof Timestamp ? item.toDate().toISOString() :
        item && typeof item === 'object' ? sanitize(item as Record<string, unknown>) : item
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}

function StepError({ error }: { error: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = error.split('\n');
  const truncated = lines.length > 3 && !expanded;
  const display = truncated ? lines.slice(0, 3).join('\n') : error;
  return (
    <div className="mt-1 ml-14 text-xs text-red-600/80 dark:text-red-400/80 font-mono whitespace-pre-wrap bg-red-500/5 rounded p-2 max-h-48 overflow-auto">
      {display}
      {lines.length > 3 && (
        <button onClick={() => setExpanded(!expanded)} className="block mt-1 text-red-600 dark:text-red-400 underline cursor-pointer">
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

type StatusFilter = 'all' | 'passed' | 'failed' | 'skipped';

export default function RunClient({ projectId, runId }: { projectId: string; runId: string }) {
  const project = useDashboardStore(s => s.getProject(projectId));
  const [run, setRun] = useState<TestRun | null>(null);
  const [loadingRun, setLoadingRun] = useState(true);
  const [errorRun, setErrorRun] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function loadRunDetail() {
      setLoadingRun(true);
      setErrorRun(null);
      try {
        const db = getDb();
        const runDoc = await getDoc(doc(db, 'runs', runId));
        if (!runDoc.exists()) { setRun(null); setLoadingRun(false); return; }
        const featuresSnap = await getDocs(collection(db, 'runs', runId, 'features'));
        const features = featuresSnap.docs.map(d => ({ id: d.id, ...sanitize(d.data()) })) as Feature[];
        setRun({ id: runDoc.id, ...sanitize(runDoc.data()), features } as TestRun);
      } catch (err) {
        console.error('Failed to load run:', err);
        setErrorRun(err instanceof Error ? err.message : 'An unexpected error occurred while loading run details.');
      } finally {
        setLoadingRun(false);
      }
    }
    if (runId && runId !== '_') { loadRunDetail(); } else { setLoadingRun(false); }
  }, [runId, retryCount]);

  const handleRetry = () => setRetryCount(c => c + 1);

  if (loadingRun) {
    return <RunDetailSkeleton />;
  }
  if (errorRun) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md w-full text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Failed to load run</h3>
          <p className="text-sm text-muted">{errorRun}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
        <Link href={'/project/' + projectId + '/'} className="text-accent text-sm hover:underline">
          Back to project
        </Link>
      </div>
    );
  }
  if (!run) {
    return (<div className="text-center py-20 text-muted"><p>Run not found.</p><Link href={'/project/' + projectId + '/'} className="text-accent mt-2 inline-block">Back to project</Link></div>);
  }

  const overallStatus = run.status || (run.summary?.failed > 0 ? 'failed' : run.summary?.skipped > 0 ? 'skipped' : 'passed');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={'/project/' + projectId + '/'} className="p-2 rounded-lg hover:bg-card-border/50 transition-colors" aria-label="Back to project">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project?.color }} />
            <h2 className="text-2xl font-bold">{project?.name || projectId}</h2>
            <span className={'text-xs px-2 py-0.5 rounded-full border ' + statusBg(overallStatus)}>{overallStatus}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted mt-1">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(run.timestamp)} at {formatTime(run.timestamp)}</span>
            <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" />{run.branch}</span>
            {run.duration > 0 && <span>{formatDuration(run.duration)}</span>}
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: run.summary?.total ?? 0, color: 'text-accent' },
          { label: 'Passed', value: run.summary?.passed ?? 0, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Failed', value: run.summary?.failed ?? 0, color: 'text-red-600 dark:text-red-400' },
          { label: 'Skipped', value: run.summary?.skipped ?? 0, color: 'text-yellow-600 dark:text-yellow-400' },
        ].map(c => (
          <div key={c.label} className="bg-card border border-card-border rounded-xl p-4 text-center">
            <p className="text-sm text-muted">{c.label}</p>
            <p className={'text-2xl font-bold ' + c.color}>{c.value}</p>
          </div>
        ))}
      </motion.div>

      {run.features && run.features.length > 0 && (() => {
        const scenarioCounts = { passed: 0, failed: 0, skipped: 0 };
        for (const f of run.features) {
          for (const s of f.scenarios || []) {
            if (s.status in scenarioCounts) scenarioCounts[s.status as keyof typeof scenarioCounts]++;
          }
        }
        const allCount = scenarioCounts.passed + scenarioCounts.failed + scenarioCounts.skipped;
        const pills: { key: StatusFilter; label: string; count: number; color: string; activeBg: string }[] = [
          { key: 'all', label: 'All', count: allCount, color: 'text-accent', activeBg: 'bg-accent/15 border-accent/40' },
          { key: 'failed', label: 'Failed', count: scenarioCounts.failed, color: 'text-red-600 dark:text-red-400', activeBg: 'bg-red-500/15 border-red-500/40' },
          { key: 'skipped', label: 'Skipped', count: scenarioCounts.skipped, color: 'text-yellow-600 dark:text-yellow-400', activeBg: 'bg-yellow-500/15 border-yellow-500/40' },
          { key: 'passed', label: 'Passed', count: scenarioCounts.passed, color: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-500/15 border-emerald-500/40' },
        ];

        const filteredFeatures = statusFilter === 'all' ? run.features : run.features
          .map(f => ({ ...f, scenarios: (f.scenarios || []).filter(s => s.status === statusFilter) }))
          .filter(f => f.scenarios.length > 0);

        return (<>
          <div className="flex items-center gap-2 flex-wrap">
            {pills.map(p => (
              <button
                key={p.key}
                onClick={() => setStatusFilter(p.key)}
                className={
                  'text-sm px-3 py-1.5 rounded-full border transition-colors font-medium ' +
                  (statusFilter === p.key ? p.activeBg + ' ' + p.color : 'border-card-border text-muted hover:border-muted')
                }
              >
                {p.label} ({p.count})
              </button>
            ))}
          </div>
          {filteredFeatures.length > 0 ? filteredFeatures.map((feature, fi) => (
          <motion.div key={feature.id || fi} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-card-border rounded-xl p-5">
            <h3 className="font-semibold text-lg mb-1">{feature.name}</h3>
            <p className="text-sm text-muted mb-2">{feature.description}</p>
            {(() => {
              const counts = (feature.scenarios || []).reduce(
                (acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1 }),
                { passed: 0, failed: 0, skipped: 0 } as Record<string, number>
              );
              const total = (feature.scenarios || []).length;
              const passRate = total > 0 ? Math.round((counts.passed / total) * 100) : 0;
              return (
                <div className="flex items-center gap-3 text-xs mb-4 flex-wrap">
                  {counts.passed > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">✅ {counts.passed} passed</span>
                  )}
                  {counts.failed > 0 && (
                    <span className="text-red-600 dark:text-red-400 font-medium">❌ {counts.failed} failed</span>
                  )}
                  {counts.skipped > 0 && (
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">⏭ {counts.skipped} skipped</span>
                  )}
                  {total > 0 && (
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-muted">{passRate}%</span>
                      <div className="w-20 h-1.5 bg-card-border rounded-full overflow-hidden flex">
                        {counts.passed > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(counts.passed / total) * 100}%` }} />}
                        {counts.failed > 0 && <div className="h-full bg-red-500" style={{ width: `${(counts.failed / total) * 100}%` }} />}
                        {counts.skipped > 0 && <div className="h-full bg-yellow-500" style={{ width: `${(counts.skipped / total) * 100}%` }} />}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="space-y-3">
              {(feature.scenarios || []).map((scenario, si) => (
                <div key={si} className="border border-card-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{scenario.name}</span>
                    <span className={'text-xs px-2 py-0.5 rounded-full border ' + statusBg(scenario.status)}>{scenario.status}</span>
                  </div>
                  <div className="space-y-1">
                    {(scenario.steps || []).map((step, si2) => (
                      <div key={si2} className="text-xs">
                        <div className="flex items-start gap-2">
                          <span className="text-accent font-mono w-12 shrink-0 font-semibold">{step.keyword}</span>
                          <span className={statusColor(step.status)}>{step.text}</span>
                          {step.duration != null && step.duration > 0 && (
                            <span className="text-muted ml-auto shrink-0">{formatDuration(step.duration)}</span>
                          )}
                        </div>
                        {step.status === 'failed' && (step.error || step.errorMessage) && (
                          <StepError error={(step.error || step.errorMessage)!} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )) : (
            <div className="text-center py-8 text-muted text-sm bg-card border border-card-border rounded-xl">
              No {statusFilter !== 'all' ? statusFilter + ' ' : ''}scenarios found.
            </div>
          )}
        </>);
      })()}

      {(!run.features || run.features.length === 0) && (
        <div className="text-center py-8 text-muted text-sm bg-card border border-card-border rounded-xl">No detailed results for this run.</div>
      )}
    </div>
  );
}
