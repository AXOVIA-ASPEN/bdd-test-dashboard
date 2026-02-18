'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { useEffect } from 'react';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: 'r', action: 'Refresh data', context: 'All pages' },
  { key: 't', action: 'Toggle dark/light theme', context: 'All pages' },
  { key: '/', action: 'Focus search/filter', context: 'Dashboard, Project pages' },
  { key: 'Esc', action: 'Close dialogs/panels', context: 'When dialog open' },
  { key: 'Backspace', action: 'Navigate back', context: 'Detail pages' },
  { key: 'Alt + ←', action: 'Navigate back', context: 'Detail pages' },
  { key: '?', action: 'Show/hide shortcuts', context: 'All pages' },
];

export function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-card border border-card-border rounded-xl shadow-2xl max-w-2xl w-full pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="shortcuts-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-card-border">
                <div className="flex items-center gap-3">
                  <Keyboard className="w-5 h-5 text-accent" />
                  <h2 id="shortcuts-title" className="text-lg font-semibold text-heading">
                    Keyboard Shortcuts
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                  aria-label="Close shortcuts dialog"
                >
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>

              {/* Shortcuts Table */}
              <div className="p-6">
                <div className="space-y-3">
                  {shortcuts.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 hover:bg-accent/5 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <kbd className="px-3 py-1.5 bg-card-border rounded-md text-sm font-mono font-medium text-heading min-w-[80px] text-center border border-accent/20">
                          {shortcut.key}
                        </kbd>
                        <span className="text-sm text-foreground flex-1">{shortcut.action}</span>
                      </div>
                      <span className="text-xs text-muted">{shortcut.context}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-card-border bg-accent/5">
                <p className="text-xs text-muted text-center">
                  Press <kbd className="px-2 py-0.5 bg-card-border rounded text-xs font-mono">?</kbd> anytime to toggle this help
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
