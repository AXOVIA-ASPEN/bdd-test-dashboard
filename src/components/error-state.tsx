'use client';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ message, onRetry, title = 'Failed to load data' }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md w-full text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto" />
        <p className="text-lg font-semibold text-red-600 dark:text-red-400">{title}</p>
        <p className="text-sm text-muted">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
