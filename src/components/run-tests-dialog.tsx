'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Terminal, Info, Copy, Check } from 'lucide-react';
import type { Project } from '@/store/use-dashboard-store';

interface RunTestsDialogProps {
  project: Project;
  open: boolean;
  onClose: () => void;
  onTriggered: (runId: string) => void;
  /** Ref to the element that triggered the dialog — focus returns here on close */
  triggerRef?: React.RefObject<HTMLElement | null>;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function RunTestsDialog({ project, open, onClose, onTriggered, triggerRef }: RunTestsDialogProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [branch, setBranch] = useState('main');
  const [copied, setCopied] = useState(false);

  const tagStr = selectedTags.length > 0 ? selectedTags.join(' and ') : '';
  const branchStr = branch && branch !== 'main' ? ` BRANCH="${branch}"` : '';
  const cmdPreview = `make ${project.makeTarget}${tagStr ? ` TAGS="${tagStr}"` : ''}${branchStr}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(cmdPreview).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback: silently ignore if clipboard API unavailable
    });
  }, [cmdPreview]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Suppress unused-var lint — kept so callers don't need changes
  void onTriggered;

  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
    // Focus trap
    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  }, [onClose]);

  // Attach keydown listener and auto-focus on open
  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    // Focus first focusable element after animation frame
    requestAnimationFrame(() => {
      if (dialogRef.current) {
        const first = dialogRef.current.querySelector<HTMLElement>(FOCUSABLE);
        first?.focus();
      }
    });
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  // Return focus to trigger on close
  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current && !open) {
      triggerRef?.current?.focus();
    }
    prevOpen.current = open;
  }, [open, triggerRef]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="run-tests-dialog-title"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card border border-card-border rounded-xl p-6 w-full max-w-lg mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-accent" />
                <h3 id="run-tests-dialog-title" className="text-lg font-semibold">Run Tests — {project.name}</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded hover:bg-card-border/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Coming Soon Notice */}
            <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-300 mb-1">Coming Soon</p>
                <p className="text-xs text-muted">
                  Remote test execution requires a Cloud Run backend that is not yet deployed.
                  For now, run tests locally using the command below.
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <span id="tag-filters-label" className="text-sm text-muted mb-2 block">Tags (select to filter)</span>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="tag-filters-label">
                {(project.tags || []).map(tag => (
                  <button
                    key={tag}
                    aria-pressed={selectedTags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-accent/20 border-accent text-accent'
                        : 'bg-card-border/30 border-card-border text-muted hover:border-accent/50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Branch */}
            <div className="mb-4">
              <label htmlFor="run-branch" className="text-sm text-muted mb-2 block">Branch</label>
              <input
                id="run-branch"
                type="text"
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                placeholder="main"
              />
            </div>

            {/* Command Preview */}
            <div className="mb-5 bg-background border border-card-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-muted" />
                  <span className="text-xs text-muted">Run locally</span>
                </div>
                <button
                  aria-label={copied ? 'Copied!' : 'Copy command'}
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-card-border/50 transition-colors text-muted hover:text-accent"
                >
                  {copied
                    ? <Check className="w-4 h-4 text-green-400" />
                    : <Copy className="w-4 h-4" />
                  }
                </button>
              </div>
              <code className="text-sm text-accent font-mono">{cmdPreview}</code>
            </div>

            {/* Close */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg border border-card-border hover:bg-card-border/50 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
