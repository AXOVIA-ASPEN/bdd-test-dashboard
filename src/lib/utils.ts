import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function statusColor(status: string): string {
  switch (status) {
    case 'passed': return 'text-emerald-400';
    case 'failed': return 'text-red-400';
    case 'skipped': return 'text-yellow-400';
    default: return 'text-slate-400';
  }
}

export function statusBg(status: string): string {
  switch (status) {
    case 'passed': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'failed': return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'skipped': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    case 'pending': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'running': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    default: return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  }
}
