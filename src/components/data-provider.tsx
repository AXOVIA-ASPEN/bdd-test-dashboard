'use client';
import { useEffect, useRef } from 'react';
import { getDb } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useDashboardStore } from '@/store/use-dashboard-store';
import type { Project, TestRun } from '@/store/use-dashboard-store';
import { sanitizeTimestamps as sanitize } from '@/lib/firestore-utils';
import { announce, announceDebounced } from '@/lib/announce';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const retryCount = useDashboardStore(s => s.retryCount);
  const initialLoad = useRef(true);
  const isRetry = useRef(false);

  // Browser online/offline detection
  useEffect(() => {
    const store = useDashboardStore.getState();
    store.setBrowserOnline(navigator.onLine);

    const handleOnline = () => useDashboardStore.getState().setBrowserOnline(true);
    const handleOffline = () => useDashboardStore.getState().setBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Page Visibility API: Refresh stale data when tab regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const store = useDashboardStore.getState();
        const lastFetchedAt = store.lastFetchedAt;
        
        // Only refresh if data is older than 60 seconds
        if (lastFetchedAt) {
          const staleThreshold = 60_000; // 60 seconds in milliseconds
          const timeSinceLastFetch = Date.now() - new Date(lastFetchedAt).getTime();
          
          if (timeSinceLastFetch > staleThreshold) {
            store.setRefreshing(true);
            store.retry();
            announceDebounced('Refreshing stale data after tab became visible');
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    isRetry.current = retryCount > 0;
    initialLoad.current = true;
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
        const s = useDashboardStore.getState();
        s.setLoading(false);
        s.setRefreshing(false);
        s.setLastFetchedAt(new Date().toISOString());
        const pCount = s.projects.length;
        const rCount = s.runs.length;
        if (s.error) {
          announce(`Error loading data: ${s.error}`);
          s.addToast(`Error loading data: ${s.error}`, 'error');
        } else {
          const message = isRetry.current
            ? 'Data refreshed successfully'
            : `Dashboard loaded. ${pCount} project${pCount !== 1 ? 's' : ''}, ${rCount} test run${rCount !== 1 ? 's' : ''}.`;
          announce(message);
          if (isRetry.current) {
            s.addToast('Data refreshed', 'success');
          }
        }
      }
    }

    // Real-time listener for projects
    const unsubProjects = onSnapshot(
      collection(db, 'projects'),
      (snapshot) => {
        const projects = snapshot.docs.map(d => ({ id: d.id, ...sanitize(d.data()) } as unknown as Project));
        useDashboardStore.getState().setProjects(projects);
        useDashboardStore.getState().setError(null);
        useDashboardStore.getState().setConnected(true);
        useDashboardStore.getState().setLastFetchedAt(new Date().toISOString());
        projectsReady = true;
        if (!initialLoad.current) announceDebounced('Data updated');
        checkInitialLoad();
      },
      (err) => {
        console.error('Firestore projects listener error:', err);
        const message = err instanceof Error ? err.message : 'Failed to load projects';
        const store = useDashboardStore.getState();
        store.setError(message);
        store.setConnected(false);
        store.addToast(`Error loading projects: ${message}`, 'error');
        announce(`Error loading data: ${message}`);
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
        useDashboardStore.getState().setRunsTruncated(snapshot.docs.length === 100);
        useDashboardStore.getState().setConnected(true);
        useDashboardStore.getState().setLastFetchedAt(new Date().toISOString());
        runsReady = true;
        if (!initialLoad.current) announceDebounced('Data updated');
        checkInitialLoad();
      },
      (err) => {
        console.error('Firestore runs listener error:', err);
        useDashboardStore.getState().setConnected(false);
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
  }, [retryCount]);

  return <>{children}</>;
}
