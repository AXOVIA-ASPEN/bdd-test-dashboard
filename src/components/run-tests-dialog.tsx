'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Terminal } from 'lucide-react';
import { triggerRun } from '@/lib/api';
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const tagStr = selectedTags.length > 0 ? selectedTags.join(' and ') : '';
  const cmdPreview = `make ${project.makeTarget}${tagStr ? ` TAGS="${tagStr}"` : ''}`;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const result = await triggerRun({
        projectId: project.id,
        repo: project.repo,
        tags: selectedTags,
        branch,
        makeTarget: project.makeTarget,
      });
      onTriggered(result.runId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to trigger run');
    } finally {
      setSubmitting(false);
    }
  };

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

            {/* Tags */}
            <div className="mb-4">
              <label className="text-sm text-muted mb-2 block">Tags (select to filter)</label>
              <div className="flex flex-wrap gap-2">
                {(project.tags || []).map(tag => (
                  <button
                    key={tag}
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
              <label className="text-sm text-muted mb-2 block">Branch</label>
              <input
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
                <span className="text-xs text-muted">Command Preview</span>
              </div>
              <code className="text-sm text-accent font-mono">{cmdPreview}</code>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg border border-card-border hover:bg-card-border/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-lg bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Triggering...' : 'Run Tests'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
