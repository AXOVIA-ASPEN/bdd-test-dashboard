'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function RunError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ projectId: string }>();

  useEffect(() => {
    console.error('Run detail error:', error);
  }, [error]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-center min-h-[60vh] px-4"
    >
      <div className="bg-card border border-card-border rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-heading">Failed to load run</h2>
        <p className="text-sm text-muted">{error.message || 'An unexpected error occurred while loading this test run.'}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <Link
            href={'/project/' + (params?.projectId ?? '') + '/'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-card-border text-sm text-muted hover:text-heading hover:border-accent/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to project
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
