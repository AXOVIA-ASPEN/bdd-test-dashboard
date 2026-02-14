'use client';
import { SummaryCards } from '@/components/summary-cards';
import { TrendChart } from '@/components/trend-chart';
import { ProjectCards } from '@/components/project-cards';
import { RecentRuns } from '@/components/recent-runs';

export default function Home() {
  return (
    <div className="space-y-8">
      <SummaryCards />
      <TrendChart />
      <ProjectCards />
      <RecentRuns />
    </div>
  );
}
