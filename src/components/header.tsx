'use client';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { Moon, Sun, FlaskConical, RefreshCw, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog';

function useRelativeTime(iso: string | null) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!iso) { setText(null); return; }
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diff < 10) return 'Just now';
      if (diff < 60) return `${diff}s ago`;
      const mins = Math.floor(diff / 60);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days}d ago`;
      return new Date(iso).toLocaleDateString();
    };
    setText(calc());
    const id = setInterval(() => setText(calc()), 15000);
    return () => clearInterval(id);
  }, [iso]);
  return text;
}

export function Header() {
  const { theme, toggleTheme, loading, retry, lastFetchedAt, addToast } = useDashboardStore();
  const relTime = useRelativeTime(lastFetchedAt);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleRefresh = () => {
    if (!loading) {
      retry();
      addToast('Refreshing data...', 'info');
    }
  };

  // Register global keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'r', handler: handleRefresh },
    { key: 't', handler: toggleTheme },
    { key: '?', handler: () => setShowShortcuts(prev => !prev) },
  ]);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-card/80 border-b border-card-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group rounded-lg focus-card focus-visible:outline-none">
          <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Silverline</h1>
            <p className="text-xs text-muted -mt-0.5">Acceptance Test Dashboard</p>
          </div>
        </Link>
        <nav aria-label="Site controls" className="flex items-center gap-2">
          {relTime && (
            <span className="text-xs text-muted hidden sm:inline">Updated {relTime}</span>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-card-border/50 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowShortcuts(true)}
            className="p-2 rounded-lg hover:bg-card-border/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            aria-label="Show keyboard shortcuts"
          >
            <HelpCircle className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-card-border/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>
        </nav>
      </div>

      <KeyboardShortcutsDialog
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </header>
  );
}
