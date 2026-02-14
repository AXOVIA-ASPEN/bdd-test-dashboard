'use client';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { Moon, Sun, FlaskConical } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export function Header() {
  const { theme, toggleTheme } = useDashboardStore();
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-card/80 border-b border-card-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Silverline</h1>
            <p className="text-xs text-muted -mt-0.5">Acceptance Test Dashboard</p>
          </div>
        </Link>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-card-border/50 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.button>
      </div>
    </header>
  );
}
