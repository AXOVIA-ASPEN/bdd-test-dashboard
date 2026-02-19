'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff, CloudOff } from 'lucide-react';
import { useDashboardStore } from '@/store/use-dashboard-store';

export function ConnectionBanner() {
  const connected = useDashboardStore(s => s.connected);
  const browserOnline = useDashboardStore(s => s.browserOnline);

  const showBanner = !browserOnline || !connected;
  const offline = !browserOnline;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className={`text-sm font-medium text-center py-2 px-4 flex items-center justify-center gap-2 ${
            offline
              ? 'bg-red-500/90 dark:bg-red-600/90 text-red-50'
              : 'bg-amber-500/90 dark:bg-amber-600/90 text-amber-950 dark:text-amber-50'
          }`}>
            {offline ? (
              <>
                <WifiOff className="h-4 w-4 shrink-0" />
                <span>You are offline — check your internet connection</span>
              </>
            ) : (
              <>
                <CloudOff className="h-4 w-4 shrink-0" />
                <span>Connection lost — data may be stale. Reconnecting…</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
