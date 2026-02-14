import { create } from 'zustand';
import * as api from '@/lib/api';

export type StepStatus = 'passed' | 'failed' | 'skipped';
export type ScenarioStatus = 'passed' | 'failed' | 'skipped';

export interface Step {
  keyword: string;
  text: string;
  status: StepStatus;
  duration: number;
  error?: string;
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
  status: string;
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

interface DashboardState {
  projects: Project[];
  runs: TestRun[];
  loading: boolean;
  theme: Theme;
  toggleTheme: () => void;
  fetchProjects: () => Promise<void>;
  fetchRuns: (projectId?: string) => Promise<void>;
  fetchRunDetail: (runId: string) => Promise<TestRun | null>;
  getProject: (id: string) => Project | undefined;
  getGlobalSummary: () => { passed: number; failed: number; skipped: number; total: number; passRate: number };
  getTrendData: (days: number) => { date: string; passRate: number; total: number }[];
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  projects: [],
  runs: [],
  loading: false,
  theme: 'dark',
  toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  fetchProjects: async () => {
    try {
      const projects = await api.fetchProjects();
      set({ projects });
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  },

  fetchRuns: async (projectId?: string) => {
    set({ loading: true });
    try {
      const runs = await api.fetchRuns(projectId);
      set({ runs, loading: false });
    } catch (err) {
      console.error('Failed to fetch runs:', err);
      set({ loading: false });
    }
  },

  fetchRunDetail: async (runId: string) => {
    try {
      return await api.fetchRunDetail(runId);
    } catch (err) {
      console.error('Failed to fetch run detail:', err);
      return null;
    }
  },

  getProject: (id) => get().projects.find(p => p.id === id),

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
