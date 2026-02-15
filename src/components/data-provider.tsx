'use client';
import { useEffect, useRef } from 'react';
import { getDb } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { useDashboardStore } from '@/store/use-dashboard-store';
import type { Project, TestRun } from '@/store/use-dashboard-store';

/** Convert Firestore Timestamps to ISO strings recursively */
function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v instanceof Timestamp) {
      out[k] = v.toDate().toISOString();
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = sanitize(v as Record<string, unknown>);
    } else if (Array.isArray(v)) {
      out[k] = v.map(item =>
        item instanceof Timestamp ? item.toDate().toISOString() :
        item && typeof item === 'object' ? sanitize(item as Record<string, unknown>) : item
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const initialLoad = useRef(true);

  useEffect(() => {
    const store = useDashboardStore.getState();
    store.setLoading(true);

    let db: ReturnType<typeof getDb>;
    try {
      db = getDb();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize Firestore';
      store.setError(message);
      store.setLoading(false);
      return;
    }

    let projectsReady = false;
    let runsReady = false;

    function checkInitialLoad() {
      if (projectsReady && runsReady && initialLoad.current) {
        initialLoad.current = false;
        useDashboardStore.getState().setLoading(false);
        useDashboardStore.getState().setLastFetchedAt(new Date().toISOString());
      }
    }

    // Real-time listener for projects
    const unsubProjects = onSnapshot(
      collection(db, 'projects'),
      (snapshot) => {
        const projects = snapshot.docs.map(d => ({ id: d.id, ...sanitize(d.data()) } as unknown as Project));
        useDashboardStore.getState().setProjects(projects);
        useDashboardStore.getState().setError(null);
        useDashboardStore.getState().setLastFetchedAt(new Date().toISOString());
        projectsReady = true;
        checkInitialLoad();
      },
      (err) => {
        console.error('Firestore projects listener error:', err);
        const message = err instanceof Error ? err.message : 'Failed to load projects';
        useDashboardStore.getState().setError(message);
        projectsReady = true;
        checkInitialLoad();
      }
    );

    // Real-time listener for runs (ordered, limited)
    const runsQuery = query(collection(db, 'runs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubRuns = onSnapshot(
      runsQuery,
      (snapshot) => {
        const runs = snapshot.docs.map(d => ({ id: d.id, ...sanitize(d.data()) } as unknown as TestRun));
        useDashboardStore.getState().setRuns(runs);
        useDashboardStore.getState().setLastFetchedAt(new Date().toISOString());
        runsReady = true;
        checkInitialLoad();
      },
      (err) => {
        console.error('Firestore runs listener error:', err);
        // Fallback: try without ordering
        const fallbackUnsub = onSnapshot(
          collection(db, 'runs'),
          (snap) => {
            const runs = snap.docs.map(d => ({ id: d.id, ...sanitize(d.data()) } as unknown as TestRun));
            useDashboardStore.getState().setRuns(runs);
            useDashboardStore.getState().setLastFetchedAt(new Date().toISOString());
            runsReady = true;
            checkInitialLoad();
          },
          () => {
            useDashboardStore.getState().setRuns([]);
            runsReady = true;
            checkInitialLoad();
          }
        );
        // Store fallback unsub for cleanup
        unsubRunsFallback = fallbackUnsub;
      }
    );

    let unsubRunsFallback: (() => void) | null = null;

    return () => {
      unsubProjects();
      unsubRuns();
      if (unsubRunsFallback) unsubRunsFallback();
    };
  }, []);

  return <>{children}</>;
}
