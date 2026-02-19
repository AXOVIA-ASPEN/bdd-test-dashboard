'use client';
import { useState, useEffect, useCallback } from 'react';
import { useDashboardStore, type TestRun, type Feature } from '@/store/use-dashboard-store';
import { getDb } from '@/lib/firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { formatDate, formatTime, formatDuration, statusBg, statusColor, deriveRunStatus } from '@/lib/utils';
import Link from 'next/link';
import { RunDetailSkeleton } from '@/components/run-detail-skeleton';
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, GitBranch, RotateCcw, ChevronsDownUp, ChevronsUpDown, Copy, Check, Link2, Download } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { AnimatePresence } from 'framer-motion';
import { sanitizeTimestamps as sanitize } from '@/lib/firestore-utils';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { TEST_IDS } from '@/lib/test-ids';

function StepError({ error }: { error: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const lines = error.split('\n');
  const truncated = lines.length > 3 && !expanded;
  const display = truncated ? lines.slice(0, 3).join('\n') : error;

  const handleCopy = () => {
    navigator.clipboard.writeText(error)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        // Gracefully handle clipboard failures (non-HTTPS, denied permissions, etc.)
        console.warn('Copy failed:', err);
        // Optionally show brief "Failed" state instead of stuck button
      });
  };

  return (
    <div className="group/error relative mt-1 ml-14 text-xs text-red-600/80 dark:text-red-400/80 font-mono whitespace-pre-wrap bg-red-500/5 rounded p-2 max-h-48 overflow-auto">
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy error message'}
        className="absolute top-1.5 right-1.5 p-1 rounded opacity-0 group-hover/error:opacity-100 focus:opacity-100 transition-opacity bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 cursor-pointer"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
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

function FeatureSections({ features, statusFilter, setStatusFilter }: { features?: Feature[]; statusFilter: StatusFilter; setStatusFilter: (f: StatusFilter) => void }) {
  // Determine which features have failures for auto-expand
  const featureHasFailure = (f: Feature) => (f.scenarios || []).some(s => s.status === 'failed');

  // Reset expanded state when statusFilter or features change
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const visible = statusFilter === 'all' ? (features || []) :
      (features || []).filter(f => (f.scenarios || []).some(s => s.status === statusFilter));
    const map: Record<string, boolean> = {};
    visible.forEach((f, i) => {
      map[f.id || String(i)] = featureHasFailure(f);
    });
    setExpandedMap(map);
  }, [features, statusFilter]);

  if (!features || features.length === 0) return null;

  const filteredKeys = (statusFilter === 'all' ? features : features.filter(f => (f.scenarios || []).some(s => s.status === statusFilter)));
  const toggleFeature = (key: string) => setExpandedMap(prev => ({ ...prev, [key]: !prev[key] }));
  const allExpanded = filteredKeys.every((f, i) => expandedMap[f.id || String(i)]);
  const toggleAll = () => {
    const newVal = !allExpanded;
    const map: Record<string, boolean> = {};
    filteredKeys.forEach((f, i) => { map[f.id || String(i)] = newVal; });
    setExpandedMap(map);
  };

  const scenarioCounts = { passed: 0, failed: 0, skipped: 0 };
  for (const f of features) {
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

  const filteredFeatures = statusFilter === 'all' ? features : features
    .map(f => ({ ...f, scenarios: (f.scenarios || []).filter(s => s.status === statusFilter) }))
    .filter(f => f.scenarios.length > 0);

  return (<>
    <div className="flex items-center gap-2 flex-wrap">
      {pills.map(p => (
        <button
          key={p.key}
          data-testid={TEST_IDS.RUN_DETAIL.SCENARIO_FILTER(p.key)}
          onClick={() => setStatusFilter(p.key)}
          className={
            'text-sm px-3 py-1.5 rounded-full border transition-colors font-medium ' +
            (statusFilter === p.key ? p.activeBg + ' ' + p.color : 'border-card-border text-muted hover:border-muted')
          }
        >
          {p.label} ({p.count})
        </button>
      ))}
      <button
        onClick={toggleAll}
        className="ml-auto text-sm px-3 py-1.5 rounded-full border border-card-border text-muted hover:border-muted transition-colors font-medium inline-flex items-center gap-1.5"
      >
        {allExpanded ? <ChevronsDownUp className="w-3.5 h-3.5" /> : <ChevronsUpDown className="w-3.5 h-3.5" />}
        {allExpanded ? 'Collapse All' : 'Expand All'}
      </button>
    </div>
    {filteredFeatures.length > 0 ? filteredFeatures.map((feature, fi) => {
      const key = feature.id || String(fi);
      const isExpanded = expandedMap[key] ?? false;
      const counts = (feature.scenarios || []).reduce(
        (acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1 }),
        { passed: 0, failed: 0, skipped: 0 } as Record<string, number>
      );
      const total = (feature.scenarios || []).length;
      const passRate = total > 0 ? Math.round((counts.passed / total) * 100) : 0;
      return (
        <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-card-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleFeature(key)}
            data-testid={TEST_IDS.RUN_DETAIL.FEATURE_TOGGLE(fi)}
            className="w-full text-left p-5 flex items-start gap-3 hover:bg-card-border/20 transition-colors cursor-pointer"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="mt-1 shrink-0"
            >
              <ChevronRight className="w-4 h-4 text-muted" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">{feature.name}</h3>
              {feature.description && <p className="text-sm text-muted mt-0.5">{feature.description}</p>}
              <div className="flex items-center gap-3 text-xs mt-2 flex-wrap">
                {counts.passed > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-medium">✅ {counts.passed} passed</span>}
                {counts.failed > 0 && <span className="text-red-600 dark:text-red-400 font-medium">❌ {counts.failed} failed</span>}
                {counts.skipped > 0 && <span className="text-yellow-600 dark:text-yellow-400 font-medium">⏭ {counts.skipped} skipped</span>}
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
            </div>
          </button>
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-3">
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
            )}
          </AnimatePresence>
        </motion.div>
      );
    }) : (
      <div className="text-center py-8 text-muted text-sm bg-card border border-card-border rounded-xl">
        No {statusFilter !== 'all' ? statusFilter + ' ' : ''}scenarios found.
      </div>
    )}
  </>);
}

/** Derive previous and next runs (chronologically) for a given project and runId */
export function deriveAdjacentRuns(
  runs: TestRun[],
  projectId: string,
  runId: string,
): { prevRun: TestRun | null; nextRun: TestRun | null } {
  const projectRuns = runs
    .filter(r => r.projectId === projectId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const idx = projectRuns.findIndex(r => r.id === runId);
  if (idx === -1) return { prevRun: null, nextRun: null };

  return {
    prevRun: idx > 0 ? projectRuns[idx - 1] : null,
    nextRun: idx < projectRuns.length - 1 ? projectRuns[idx + 1] : null,
  };
}

export default function RunClient({ projectId, runId }: { projectId: string; runId: string }) {
  const project = useDashboardStore(s => s.getProject(projectId));
  const allRuns = useDashboardStore(s => s.runs ?? []);
  const { prevRun, nextRun } = deriveAdjacentRuns(allRuns, projectId, runId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [run, setRun] = useState<TestRun | null>(null);
  const [loadingRun, setLoadingRun] = useState(true);
  const [errorRun, setErrorRun] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    const status = searchParams.get('status');
    return status && ['all', 'passed', 'failed', 'skipped'].includes(status)
      ? (status as StatusFilter)
      : 'all';
  });
  const [retryCount, setRetryCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Update URL when status filter changes
  const updateStatusFilter = useCallback(
    (newStatus: StatusFilter) => {
      setStatusFilter(newStatus);
      const params = new URLSearchParams(searchParams.toString());
      
      if (newStatus === 'all') {
        params.delete('status');
      } else {
        params.set('status', newStatus);
      }
      
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Register keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'Backspace', handler: () => router.push(`/project/${projectId}/`) },
    { key: 'ArrowLeft', alt: true, handler: () => router.push(`/project/${projectId}/`) },
  ]);

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[aria-label="Export test run"]') && !target.closest('.absolute')) {
        setShowExportMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showExportMenu]);

  useEffect(() => {
    if (run && project) {
      const runDate = run.timestamp ? new Date(run.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Run';
      document.title = `Run ${runDate} - ${project.name} | BDD Dashboard`;
    } else if (project) {
      document.title = `${project.name} | BDD Dashboard`;
    }
    return () => { document.title = 'Silverline | Acceptance Test Dashboard'; };
  }, [run, project]);

  useEffect(() => {
    if (!runId || runId === '_') { setLoadingRun(false); return; }

    setLoadingRun(true);
    setErrorRun(null);
    setIsLive(false);

    const db = getDb();

    // Local state for merging two independent snapshots
    let latestRunBase: (Omit<TestRun, 'features'> & { id: string }) | null | undefined = undefined;
    let latestFeatures: Feature[] = [];
    let runLoaded = false;
    let featuresLoaded = false;

    const merge = () => {
      if (!runLoaded || !featuresLoaded) return;
      setLoadingRun(false);
      if (latestRunBase === null) {
        setRun(null);
        setIsLive(false);
      } else if (latestRunBase !== undefined) {
        setRun({ ...latestRunBase, features: latestFeatures } as TestRun);
        setIsLive(true);
      }
    };

    const unsubRun = onSnapshot(
      doc(db, 'runs', runId),
      (snap) => {
        runLoaded = true;
        if (!snap.exists()) {
          latestRunBase = null;
        } else {
          latestRunBase = { id: snap.id, ...sanitize(snap.data()) } as Omit<TestRun, 'features'> & { id: string };
        }
        merge();
      },
      (err) => {
        console.error('Run listener error:', err);
        setErrorRun(err.message || 'An unexpected error occurred while loading run details.');
        setLoadingRun(false);
        setIsLive(false);
      }
    );

    const unsubFeatures = onSnapshot(
      collection(db, 'runs', runId, 'features'),
      (snap) => {
        featuresLoaded = true;
        latestFeatures = snap.docs.map(d => ({ id: d.id, ...sanitize(d.data()) } as Feature));
        merge();
      },
      (err) => {
        console.error('Features listener error:', err);
        featuresLoaded = true; // Don't block the UI — show run without features
        merge();
      }
    );

    return () => {
      unsubRun();
      unsubFeatures();
      setIsLive(false);
    };
  }, [runId, retryCount]);

  const handleRetry = () => setRetryCount(c => c + 1);

  const handleCopyLink = useCallback(() => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch((err) => {
        console.warn('Copy link failed:', err);
        // Gracefully handle clipboard failures
      });
  }, []);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateMarkdownReport = useCallback((run: TestRun, project: { name: string } | undefined): string => {
    const { passed, failed, skipped, total } = run.summary || { passed: 0, failed: 0, skipped: 0, total: 0 };
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    
    let md = `# Test Run Report: ${project?.name || 'Unknown Project'}\n\n`;
    md += `**Date:** ${formatDate(run.timestamp)} at ${formatTime(run.timestamp)}\n`;
    md += `**Branch:** ${run.branch || 'unknown'}\n`;
    if (run.environment) md += `**Environment:** ${run.environment}\n`;
    md += `**Duration:** ${formatDuration(run.duration)}\n`;
    md += `**Pass Rate:** ${passRate}%\n\n`;
    
    md += `## Summary\n\n`;
    md += `- ✅ Passed: ${passed}\n`;
    md += `- ❌ Failed: ${failed}\n`;
    md += `- ⏭️ Skipped: ${skipped}\n`;
    md += `- 📊 Total: ${total}\n\n`;
    
    if (run.tags && run.tags.length > 0) {
      md += `**Tags:** ${run.tags.map(t => `\`${t}\``).join(', ')}\n\n`;
    }
    
    md += `---\n\n`;
    
    // Features and scenarios
    for (const feature of run.features || []) {
      md += `## ${feature.name}\n\n`;
      if (feature.description) {
        md += `${feature.description}\n\n`;
      }
      
      for (const scenario of feature.scenarios || []) {
        const statusEmoji = scenario.status === 'passed' ? '✅' : scenario.status === 'failed' ? '❌' : '⏭️';
        md += `### ${statusEmoji} ${scenario.name}\n\n`;
        md += `**Status:** ${scenario.status}\n`;
        md += `**Duration:** ${formatDuration(scenario.duration)}\n\n`;
        
        if (scenario.tags && scenario.tags.length > 0) {
          md += `**Tags:** ${scenario.tags.map(t => `\`${t}\``).join(', ')}\n\n`;
        }
        
        md += `**Steps:**\n\n`;
        for (const step of scenario.steps || []) {
          const stepStatus = step.status === 'passed' ? '✅' : step.status === 'failed' ? '❌' : '⏭️';
          md += `- ${stepStatus} ${step.keyword} ${step.text}`;
          if (step.duration && step.duration > 0) {
            md += ` (${formatDuration(step.duration)})`;
          }
          md += `\n`;
          
          if (step.error || step.errorMessage) {
            md += `  \`\`\`\n`;
            md += `  ${step.error || step.errorMessage}\n`;
            md += `  \`\`\`\n`;
          }
        }
        md += `\n`;
      }
    }
    
    md += `---\n\n`;
    md += `*Generated by BDD Test Dashboard on ${new Date().toISOString()}*\n`;
    
    return md;
  }, []);

  const exportRun = useCallback((format: 'json' | 'markdown') => {
    if (!run || !project) return;
    
    const filename = `${project.name}-run-${new Date(run.timestamp).toISOString().split('T')[0]}`;
    
    if (format === 'json') {
      const json = JSON.stringify(run, null, 2);
      downloadFile(json, `${filename}.json`, 'application/json');
    } else {
      const markdown = generateMarkdownReport(run, project);
      downloadFile(markdown, `${filename}.md`, 'text/markdown');
    }
    
    setShowExportMenu(false);
    useDashboardStore.getState().addToast(`Exported as ${format.toUpperCase()}`, 'success');
  }, [run, project, generateMarkdownReport]);

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
            data-testid={TEST_IDS.RUN_DETAIL.RETRY_BTN}
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

  const overallStatus = deriveRunStatus(run);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: project?.name || projectId, href: '/project/' + projectId + '/' },
          { label: run.timestamp ? 'Run ' + new Date(run.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Run Details' },
        ]}
      />

      {/* Previous / Next run navigation */}
      <div className="flex items-center gap-2">
        {prevRun ? (
          <Link
            href={'/project/' + projectId + '/run/' + prevRun.id + '/'}
            title={'Previous run: ' + new Date(prevRun.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            aria-label="Previous run"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-card-border text-muted hover:border-accent hover:text-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </Link>
        ) : (
          <span
            aria-disabled="true"
            aria-label="No previous run"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-card-border text-muted/40 cursor-not-allowed select-none"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </span>
        )}

        {nextRun ? (
          <Link
            href={'/project/' + projectId + '/run/' + nextRun.id + '/'}
            title={'Next run: ' + new Date(nextRun.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            aria-label="Next run"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-card-border text-muted hover:border-accent hover:text-accent transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <span
            aria-disabled="true"
            aria-label="No next run"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-card-border text-muted/40 cursor-not-allowed select-none"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project?.color }} />
            <h2 className="text-2xl font-bold">{project?.name || projectId}</h2>
            <button
              onClick={handleCopyLink}
              aria-label="Copy link to clipboard"
              className="p-1.5 rounded-lg hover:bg-card-border/50 transition-colors text-muted hover:text-foreground"
            >
              {linkCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
            </button>
            <span className={'text-xs px-2 py-0.5 rounded-full border ' + statusBg(overallStatus)}>{overallStatus}</span>
            {isLive && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                Live
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted mt-1">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(run.timestamp)} at {formatTime(run.timestamp)}</span>
            <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" />{run.branch}</span>
            {run.duration > 0 && <span>{formatDuration(run.duration)}</span>}
          </div>
        </div>
        <div className="relative ml-auto">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-card border border-card-border rounded-lg hover:bg-card-border/50 transition-colors text-sm"
            aria-label="Export test run"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          {showExportMenu && (
            <div className="absolute top-full right-0 mt-2 bg-card border border-card-border rounded-lg shadow-lg p-2 z-50 min-w-[160px]">
              <button 
                onClick={() => exportRun('json')} 
                className="w-full text-left px-3 py-2 rounded hover:bg-card-border/50 text-sm transition-colors"
              >
                📦 JSON
              </button>
              <button 
                onClick={() => exportRun('markdown')} 
                className="w-full text-left px-3 py-2 rounded hover:bg-card-border/50 text-sm transition-colors"
              >
                📝 Markdown
              </button>
            </div>
          )}
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

      {run.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-600 dark:text-red-400">Run Error</h3>
          </div>
          <pre className="text-xs text-red-600/80 dark:text-red-400/80 font-mono whitespace-pre-wrap max-h-48 overflow-auto">{run.error}</pre>
        </div>
      )}

      <FeatureSections features={run.features} statusFilter={statusFilter} setStatusFilter={updateStatusFilter} />

      {(!run.features || run.features.length === 0) && (
        <div className="text-center py-8 text-muted text-sm bg-card border border-card-border rounded-xl">No detailed results for this run.</div>
      )}
    </div>
  );
}
