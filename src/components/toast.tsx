'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useEffect } from 'react';
import { useDashboardStore } from '@/store/use-dashboard-store';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function ToastContainer() {
  const toasts = useDashboardStore((state) => state.toasts);
  const removeToast = useDashboardStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.slice(0, 3).map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bgColor = {
    success: 'bg-emerald-500/10 border-emerald-500/50',
    error: 'bg-red-500/10 border-red-500/50',
    info: 'bg-blue-500/10 border-blue-500/50',
  }[toast.type];

  const textColor = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    info: 'text-blue-400',
  }[toast.type];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100 }}
      role="status"
      aria-live="polite"
      onClick={onDismiss}
      className={`${bgColor} border rounded-lg shadow-lg p-4 flex items-start gap-3 cursor-pointer hover:bg-card/50 transition-colors relative overflow-hidden`}
    >
      <Icon className={`w-5 h-5 ${textColor} shrink-0 mt-0.5`} />
      <p className="text-sm flex-1 pr-6">{toast.message}</p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="absolute top-2 right-2 text-muted hover:text-foreground transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 4, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-1 ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'} origin-left`}
      />
    </motion.div>
  );
}
