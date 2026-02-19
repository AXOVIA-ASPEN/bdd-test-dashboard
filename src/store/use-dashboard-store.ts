import { create } from 'zustand';

export type StepStatus = 'passed' | 'failed' | 'skipped';
export type ScenarioStatus = 'passed' | 'failed' | 'skipped';

export interface Step {
  keyword: string;
  text: string;
  status: StepStatus;
  duration: number;
  error?: string;
  errorMessage?: string;
}

export interface Scenario {
  id?: string;
  name: string;
  status: ScenarioStatus;
  steps: Step[];
  tags: string[];
  duration: number;
}

export interface Feature {
  id?: string;
  name: string;
  description: string;
  scenarios: Scenario[];
}

export interface TestRun {
  id: string;
  projectId: string;
  timestamp: string;
  branch: string;
  environment?: string;
  duration: number;
  status?: string;
  tags?: string[];
  makeTarget?: string;
  error?: string;
  features?: Feature[];
  summary: { passed: number; failed: number; skipped: number; total: number };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  repo: string;
  makeTarget: string;
  tags: string[];
}

type Theme = 'light' | 'dark';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface DashboardState {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  projects: Project[];
  runs: TestRun[];
  runsTruncated: boolean;
  loading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastFetchedAt: string | null;
  connected: boolean;
  setConnected: (val: boolean) => void;
  browserOnline: boolean;
  setBrowserOnline: (val: boolean) => void;
  theme: Theme;
  toggleTheme: () => void;
  setProjects: (projects: Project[]) => void;
  setRuns: (runs: TestRun[]) => void;
  setRunsTruncated: (truncated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  setLastFetchedAt: (ts: string | null) => void;
  retryCount: number;
  retry: () => void;
  getProject: (id: string) => Project | undefined;
  getRun: (projectId: string, runId: string) => TestRun | undefined;
  getGlobalSummary: () => { passed: number; failed: number; skipped: number; total: number; passRate: number };
  getTrendData: (days: number) => { date: string; passRate: number; total: number }[];
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  projects: [],
  runs: [],
  runsTruncated: false,
  loading: true,
  isRefreshing: false,
  error: null,
  lastFetchedAt: null,
  connected: true,
  setConnected: (val) => set({ connected: val }),
  browserOnline: true, // Default to true; DataProvider effect sets actual value on mount
  setBrowserOnline: (val) => set({ browserOnline: val }),
  toasts: [],
  addToast: (message, type = 'info') => set(s => ({
    toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }]
  })),
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  theme: (() => { try { return (localStorage.getItem('bdd-theme') as Theme) || 'dark'; } catch { return 'dark' as Theme; } })(),
  toggleTheme: () => set(s => {
    const next = s.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('bdd-theme', next); } catch {}
    return { theme: next };
  }),
  setProjects: (projects) => set({ projects }),
  setRuns: (runs) => set({ runs }),
  setRunsTruncated: (truncated) => set({ runsTruncated: truncated }),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
  setError: (error) => set({ error }),
  setLastFetchedAt: (ts) => set({ lastFetchedAt: ts }),
  retryCount: 0,
  retry: () => set(s => ({ retryCount: s.retryCount + 1, error: null, loading: true })),
  getProject: (id) => get().projects.find(p => p.id === id),
  getRun: (projectId, runId) => get().runs.find(r => r.projectId === projectId && r.id === runId),

  getGlobalSummary: () => {
    const { runs, projects } = get();
    const latestRuns = projects.map(p =>
      runs.find(r => r.projectId === p.id)
    ).filter(Boolean) as TestRun[];
    const s = latestRuns.reduce((acc, r) => ({
      passed: acc.passed + (r.summary?.passed || 0),
      failed: acc.failed + (r.summary?.failed || 0),
      skipped: acc.skipped + (r.summary?.skipped || 0),
      total: acc.total + (r.summary?.total || 0),
    }), { passed: 0, failed: 0, skipped: 0, total: 0 });
    return { ...s, passRate: s.total > 0 ? Math.round((s.passed / s.total) * 100) : 0 };
  },

  getTrendData: (days) => {
    const { runs } = get();
    const now = Date.now();
    const result: { date: string; passRate: number; total: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i + 1) * 86400000;
      const dayEnd = now - i * 86400000;
      const runsInDay = runs.filter(r => {
        const t = new Date(r.timestamp).getTime();
        return t >= dayStart && t < dayEnd;
      });
      if (runsInDay.length > 0) {
        const totals = runsInDay.reduce((a, r) => ({
          p: a.p + (r.summary?.passed || 0),
          t: a.t + (r.summary?.total || 0),
        }), { p: 0, t: 0 });
        result.push({
          date: new Date(dayEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          passRate: totals.t > 0 ? Math.round((totals.p / totals.t) * 100) : 0,
          total: totals.t,
        });
      }
    }
    return result;
  },
}));
