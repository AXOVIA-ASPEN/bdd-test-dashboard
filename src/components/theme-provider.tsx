'use client';
import { useEffect } from 'react';
import { useDashboardStore } from '@/store/use-dashboard-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useDashboardStore(s => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return <>{children}</>;
}
