'use client';
import { useEffect } from 'react';
import { getDb } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useDashboardStore } from '@/store/use-dashboard-store';
import type { Project, TestRun } from '@/store/use-dashboard-store';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { setProjects, setRuns, setLoading } = useDashboardStore();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const db = getDb();

        const projSnap = await getDocs(collection(db, 'projects'));
        const projects = projSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
        setProjects(projects);

        const runsQuery = query(collection(db, 'runs'), orderBy('timestamp', 'desc'), limit(100));
        const runsSnap = await getDocs(runsQuery);
        const runs = runsSnap.docs.map(d => ({ id: d.id, ...d.data() } as TestRun));
        setRuns(runs);
      } catch (err) {
        console.error('Failed to load data from Firestore:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [setProjects, setRuns, setLoading]);

  return <>{children}</>;
}
