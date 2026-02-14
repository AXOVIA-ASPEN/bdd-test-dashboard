'use client';
import { useState, useEffect } from 'react';
import { useDashboardStore, type TestRun, type Feature } from '@/store/use-dashboard-store';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { formatDate, formatTime, formatDuration, statusBg, statusColor } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Clock, GitBranch, Loader2 } from 'lucide-react';

export default function RunClient({ projectId, runId }: { projectId: string; runId: string }) {
  const project = useDashboardStore(s => s.getProject(projectId));
  const [run, setRun] = useState<TestRun | null>(null);
  const [loadingRun, setLoadingRun] = useState(true);

  useEffect(() => {
    async function loadRunDetail() {
      try {
        const db = getDb();
        const runDoc = await getDoc(doc(db, 'runs', runId));
        if (!runDoc.exists()) { setLoadingRun(false); return; }
        const featuresSnap = await getDocs(collection(db, 'runs', runId, 'features'));
        const features = featuresSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Feature[];
        setRun({ id: runDoc.id, ...runDoc.data(), features } as TestRun);
      } catch (err) {
        console.error('Failed to load run:', err);
      } finally {
        setLoadingRun(false);
      }
    }
    if (runId && runId !== '_') { loadRunDetail(); } else { setLoadingRun(false); }
  }, [runId]);

  if (loadingRun) {
    return (<div className="flex items-center justify-center py-20 gap-3 text-muted"><Loader2 className="w-5 h-5 animate-spin" />Loading run...</div>);
  }
  if (!run) {
    return (<div className="text-center py-20 text-muted"><p>Run not found.</p><Link href={'/project/' + projectId + '/'} className="text-accent mt-2 inline-block">Back to project</Link></div>);
  }

  const overallStatus = run.status || (run.summary?.failed > 0 ? 'failed' : run.summary?.skipped > 0 ? 'skipped' : 'passed');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={'/project/' + projectId + '/'} className="p-2 rounded-lg hover:bg-card-border/50 transition-colors">
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
          { label: 'Passed', value: run.summary?.passed ?? 0, color: 'text-emerald-400' },
          { label: 'Failed', value: run.summary?.failed ?? 0, color: 'text-red-400' },
          { label: 'Skipped', value: run.summary?.skipped ?? 0, color: 'text-yellow-400' },
        ].map(c => (
          <div key={c.label} className="bg-card border border-card-border rounded-xl p-4 text-center">
            <p className="text-sm text-muted">{c.label}</p>
            <p className={'text-2xl font-bold ' + c.color}>{c.value}</p>
          </div>
        ))}
      </motion.div>

      {run.features && run.features.length > 0 ? (
        run.features.map((feature, fi) => (
          <motion.div key={feature.id || fi} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-card-border rounded-xl p-5">
            <h3 className="font-semibold text-lg mb-1">{feature.name}</h3>
            <p className="text-sm text-muted mb-4">{feature.description}</p>
            <div className="space-y-3">
              {(feature.scenarios || []).map((scenario, si) => (
                <div key={si} className="border border-card-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{scenario.name}</span>
                    <span className={'text-xs px-2 py-0.5 rounded-full border ' + statusBg(scenario.status)}>{scenario.status}</span>
                  </div>
                  <div className="space-y-1">
                    {(scenario.steps || []).map((step, si2) => (
                      <div key={si2} className="flex items-start gap-2 text-xs">
                        <span className="text-accent font-mono w-12 shrink-0 font-semibold">{step.keyword}</span>
                        <span className={statusColor(step.status)}>{step.text}</span>
                        <span className="text-muted ml-auto shrink-0">{step.duration}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))
      ) : (
        <div className="text-center py-8 text-muted text-sm bg-card border border-card-border rounded-xl">No detailed results for this run.</div>
      )}
    </div>
  );
}
