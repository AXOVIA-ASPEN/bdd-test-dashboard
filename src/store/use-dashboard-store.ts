import { create } from 'zustand';
import { projects, type Project, type TestRun } from '@/data/mock-data';

type Theme = 'light' | 'dark';

interface DashboardState {
  projects: Project[];
  theme: Theme;
  toggleTheme: () => void;
  getProject: (id: string) => Project | undefined;
  getRun: (projectId: string, runId: string) => TestRun | undefined;
  getAllRuns: () => TestRun[];
  getGlobalSummary: () => { passed: number; failed: number; skipped: number; total: number; passRate: number };
  getTrendData: (days: number) => { date: string; passRate: number; total: number }[];
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  projects,
  theme: 'dark',
  toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  getProject: (id) => get().projects.find(p => p.id === id),
  getRun: (projectId, runId) => {
    const project = get().projects.find(p => p.id === projectId);
    return project?.runs.find(r => r.id === runId);
  },
  getAllRuns: () => get().projects.flatMap(p => p.runs).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  getGlobalSummary: () => {
    const latestRuns = get().projects.map(p => p.runs[p.runs.length - 1]).filter(Boolean);
    const s = latestRuns.reduce((acc, r) => ({
      passed: acc.passed + r.summary.passed,
      failed: acc.failed + r.summary.failed,
      skipped: acc.skipped + r.summary.skipped,
      total: acc.total + r.summary.total,
    }), { passed: 0, failed: 0, skipped: 0, total: 0 });
    return { ...s, passRate: s.total > 0 ? Math.round((s.passed / s.total) * 100) : 0 };
  },
  getTrendData: (days) => {
    const allRuns = get().getAllRuns();
    const now = Date.now();
    const result: { date: string; passRate: number; total: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i + 1) * 86400000;
      const dayEnd = now - i * 86400000;
      const runsInDay = allRuns.filter(r => {
        const t = new Date(r.timestamp).getTime();
        return t >= dayStart && t < dayEnd;
      });
      if (runsInDay.length > 0) {
        const totals = runsInDay.reduce((a, r) => ({ p: a.p + r.summary.passed, t: a.t + r.summary.total }), { p: 0, t: 0 });
        result.push({
          date: new Date(dayEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          passRate: Math.round((totals.p / totals.t) * 100),
          total: totals.t,
        });
      }
    }
    return result;
  },
}));
