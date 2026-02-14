'use client';
import { useEffect, useRef } from 'react';
import { getDb } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
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
  const loaded = useRef(false);
  const retryCount = useDashboardStore(s => s.retryCount);

  useEffect(() => {
    if (loaded.current && retryCount === 0) return;
    loaded.current = true;

    async function loadData() {
      const store = useDashboardStore.getState();
      try {
        store.setLoading(true);
        const db = getDb();

        const projSnap = await getDocs(collection(db, 'projects'));
        const projects = projSnap.docs.map(d => ({ id: d.id, ...sanitize(d.data()) } as unknown as Project));
        useDashboardStore.getState().setProjects(projects);
        useDashboardStore.getState().setError(null);

        try {
          const runsQuery = query(collection(db, 'runs'), orderBy('timestamp', 'desc'), limit(100));
          const runsSnap = await getDocs(runsQuery);
          const runs = runsSnap.docs.map(d => ({ id: d.id, ...sanitize(d.data()) } as unknown as TestRun));
          useDashboardStore.getState().setRuns(runs);
        } catch {
          try {
            const runsSnap = await getDocs(collection(db, 'runs'));
            const runs = runsSnap.docs.map(d => ({ id: d.id, ...sanitize(d.data()) } as unknown as TestRun));
            useDashboardStore.getState().setRuns(runs);
          } catch {
            useDashboardStore.getState().setRuns([]);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load data from Firestore';
        console.error('Failed to load from Firestore:', err);
        useDashboardStore.getState().setError(message);
      } finally {
        useDashboardStore.getState().setLoading(false);
      }
    }
    loadData();
  }, [retryCount]);

  return <>{children}</>;
}
