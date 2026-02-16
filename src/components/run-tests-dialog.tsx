'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Terminal, Info } from 'lucide-react';
import type { Project } from '@/store/use-dashboard-store';

interface RunTestsDialogProps {
  project: Project;
  open: boolean;
  onClose: () => void;
  onTriggered: (runId: string) => void;
}

export function RunTestsDialog({ project, open, onClose, onTriggered }: RunTestsDialogProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [branch, setBranch] = useState('main');

  const tagStr = selectedTags.length > 0 ? selectedTags.join(' and ') : '';
  const cmdPreview = `make ${project.makeTarget}${tagStr ? ` TAGS="${tagStr}"` : ''}`;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Suppress unused-var lint — kept so callers don't need changes
  void onTriggered;

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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card border border-card-border rounded-xl p-6 w-full max-w-lg mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-accent" />
                <h3 className="text-lg font-semibold">Run Tests — {project.name}</h3>
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
              <div className="flex items-center gap-2 mb-1">
                <Terminal className="w-3.5 h-3.5 text-muted" />
                <span className="text-xs text-muted">Run locally</span>
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
