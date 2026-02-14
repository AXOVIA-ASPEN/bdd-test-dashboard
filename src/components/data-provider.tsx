'use client';
import { useEffect, useRef } from 'react';
import { getDb } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useDashboardStore } from '@/store/use-dashboard-store';
import type { Project, TestRun } from '@/store/use-dashboard-store';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    async function loadData() {
      const store = useDashboardStore.getState();
      try {
        store.setLoading(true);
        const db = getDb();

        const projSnap = await getDocs(collection(db, 'projects'));
        const projects = projSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
        useDashboardStore.getState().setProjects(projects);

        try {
          const runsQuery = query(collection(db, 'runs'), orderBy('timestamp', 'desc'), limit(100));
          const runsSnap = await getDocs(runsQuery);
          const runs = runsSnap.docs.map(d => ({ id: d.id, ...d.data() } as TestRun));
          useDashboardStore.getState().setRuns(runs);
        } catch {
          try {
            const runsSnap = await getDocs(collection(db, 'runs'));
            const runs = runsSnap.docs.map(d => ({ id: d.id, ...d.data() } as TestRun));
            useDashboardStore.getState().setRuns(runs);
          } catch {
            useDashboardStore.getState().setRuns([]);
          }
        }
      } catch (err) {
        console.error('Failed to load from Firestore:', err);
      } finally {
        useDashboardStore.getState().setLoading(false);
      }
    }
    loadData();
  }, []);

  return <>{children}</>;
}
