import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore, type Project, type TestRun } from './use-dashboard-store';

const mockProjects: Project[] = [
  { id: 'p1', name: 'Project 1', description: 'Desc', color: '#f00', repo: 'org/p1', makeTarget: 'test', tags: ['smoke'] },
  { id: 'p2', name: 'Project 2', description: 'Desc2', color: '#0f0', repo: 'org/p2', makeTarget: 'test', tags: [] },
];

const now = Date.now();
const mockRuns: TestRun[] = [
  {
    id: 'r1', projectId: 'p1', timestamp: new Date(now - 3600000).toISOString(),
    branch: 'main', duration: 5000,
    summary: { passed: 8, failed: 2, skipped: 1, total: 11 },
  },
  {
    id: 'r2', projectId: 'p2', timestamp: new Date(now - 7200000).toISOString(),
    branch: 'main', duration: 3000,
    summary: { passed: 5, failed: 0, skipped: 0, total: 5 },
  },
  {
    id: 'r3', projectId: 'p1', timestamp: new Date(now - 90000000).toISOString(),
    branch: 'dev', duration: 4000,
    summary: { passed: 6, failed: 4, skipped: 0, total: 10 },
  },
];

beforeEach(() => {
  useDashboardStore.setState({
    projects: [],
    runs: [],
    loading: true,
    error: null,
    theme: 'dark',
    retryCount: 0,
  });
});

describe('useDashboardStore', () => {
  describe('setters', () => {
    it('sets projects', () => {
      useDashboardStore.getState().setProjects(mockProjects);
      expect(useDashboardStore.getState().projects).toEqual(mockProjects);
    });

    it('sets runs', () => {
      useDashboardStore.getState().setRuns(mockRuns);
      expect(useDashboardStore.getState().runs).toEqual(mockRuns);
    });

    it('sets loading', () => {
      useDashboardStore.getState().setLoading(false);
      expect(useDashboardStore.getState().loading).toBe(false);
    });

    it('sets error', () => {
      useDashboardStore.getState().setError('something broke');
      expect(useDashboardStore.getState().error).toBe('something broke');
    });

    it('clears error with null', () => {
      useDashboardStore.getState().setError('err');
      useDashboardStore.getState().setError(null);
      expect(useDashboardStore.getState().error).toBeNull();
    });
  });

  describe('toggleTheme', () => {
    it('toggles dark to light', () => {
      useDashboardStore.getState().toggleTheme();
      expect(useDashboardStore.getState().theme).toBe('light');
    });

    it('toggles light to dark', () => {
      useDashboardStore.setState({ theme: 'light' });
      useDashboardStore.getState().toggleTheme();
      expect(useDashboardStore.getState().theme).toBe('dark');
    });
  });

  describe('retry', () => {
    it('increments retryCount and resets error/loading', () => {
      useDashboardStore.setState({ error: 'fail', loading: false, retryCount: 2 });
      useDashboardStore.getState().retry();
      const s = useDashboardStore.getState();
      expect(s.retryCount).toBe(3);
      expect(s.error).toBeNull();
      expect(s.loading).toBe(true);
    });
  });

  describe('getProject', () => {
    it('finds project by id', () => {
      useDashboardStore.getState().setProjects(mockProjects);
      expect(useDashboardStore.getState().getProject('p1')?.name).toBe('Project 1');
    });

    it('returns undefined for missing project', () => {
      useDashboardStore.getState().setProjects(mockProjects);
      expect(useDashboardStore.getState().getProject('nope')).toBeUndefined();
    });
  });

  describe('getRun', () => {
    it('finds run by projectId and runId', () => {
      useDashboardStore.getState().setRuns(mockRuns);
      expect(useDashboardStore.getState().getRun('p1', 'r1')?.branch).toBe('main');
    });

    it('returns undefined for missing run', () => {
      useDashboardStore.getState().setRuns(mockRuns);
      expect(useDashboardStore.getState().getRun('p1', 'r999')).toBeUndefined();
    });
  });

  describe('getGlobalSummary', () => {
    it('aggregates latest run per project', () => {
      useDashboardStore.setState({ projects: mockProjects, runs: mockRuns });
      const summary = useDashboardStore.getState().getGlobalSummary();
      // Latest for p1 is r1 (passed:8,failed:2,skipped:1,total:11)
      // Latest for p2 is r2 (passed:5,failed:0,skipped:0,total:5)
      // runs.find returns first match, which is r1 for p1 and r2 for p2
      expect(summary.passed).toBe(13);
      expect(summary.failed).toBe(2);
      expect(summary.skipped).toBe(1);
      expect(summary.total).toBe(16);
      expect(summary.passRate).toBe(81); // 13/16 = 81.25 rounds to 81
    });

    it('returns zero passRate when no runs', () => {
      useDashboardStore.setState({ projects: mockProjects, runs: [] });
      const summary = useDashboardStore.getState().getGlobalSummary();
      expect(summary.passRate).toBe(0);
      expect(summary.total).toBe(0);
    });

    it('handles runs with missing summary fields', () => {
      const runsNoSummary: TestRun[] = [
        { id: 'r1', projectId: 'p1', timestamp: new Date().toISOString(), branch: 'main', duration: 1000 } as TestRun,
        { id: 'r2', projectId: 'p2', timestamp: new Date().toISOString(), branch: 'main', duration: 1000, summary: {} as any } as TestRun,
      ];
      useDashboardStore.setState({ projects: mockProjects, runs: runsNoSummary });
      const summary = useDashboardStore.getState().getGlobalSummary();
      expect(summary.passed).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.total).toBe(0);
      expect(summary.passRate).toBe(0);
    });
  });

  describe('getTrendData', () => {
    it('returns trend data for runs within range', () => {
      useDashboardStore.setState({ runs: mockRuns });
      const trend = useDashboardStore.getState().getTrendData(7);
      expect(Array.isArray(trend)).toBe(true);
      // At least one entry should exist (today's runs)
      expect(trend.length).toBeGreaterThanOrEqual(1);
    });

    it('returns empty array when no runs in range', () => {
      useDashboardStore.setState({ runs: [] });
      const trend = useDashboardStore.getState().getTrendData(7);
      expect(trend).toEqual([]);
    });

    it('each entry has date, passRate, total', () => {
      useDashboardStore.setState({ runs: mockRuns });
      const trend = useDashboardStore.getState().getTrendData(7);
      for (const entry of trend) {
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('passRate');
        expect(entry).toHaveProperty('total');
        expect(typeof entry.passRate).toBe('number');
      }
    });
  });
});
