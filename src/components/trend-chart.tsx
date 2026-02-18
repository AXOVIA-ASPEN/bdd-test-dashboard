'use client';
import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardStore } from '@/store/use-dashboard-store';

interface DayData {
  date: string;
  passRate: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

const TIME_RANGES = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
] as const;

export function TrendChart() {
  const runs = useDashboardStore(s => s.runs);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Initialize time range from localStorage or default to 14
  const [timeRange, setTimeRange] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-trend-range');
      return saved ? parseInt(saved, 10) : 14;
    }
    return 14;
  });

  // Persist time range to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-trend-range', timeRange.toString());
    }
  }, [timeRange]);

  const data = useMemo(() => {
    const now = Date.now();
    const days = timeRange;
    const result: DayData[] = [];
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
          f: a.f + (r.summary?.failed || 0),
          s: a.s + (r.summary?.skipped || 0),
          t: a.t + (r.summary?.total || 0),
        }), { p: 0, f: 0, s: 0, t: 0 });
        result.push({
          date: new Date(dayEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          passRate: totals.t > 0 ? Math.round((totals.p / totals.t) * 100) : 0,
          total: totals.t,
          passed: totals.p,
          failed: totals.f,
          skipped: totals.s,
        });
      }
    }
    return result;
  }, [runs, timeRange]);

  if (data.length === 0) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Pass Rate Trend</h3>
          <div className="flex gap-1" role="group" aria-label="Time range selector">
            {TIME_RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  timeRange === range.value
                    ? 'bg-accent text-white'
                    : 'text-muted hover:bg-card-border hover:text-foreground'
                }`}
                aria-label={`Show ${range.label}`}
                aria-pressed={timeRange === range.value}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center h-40 text-muted text-sm">
          No test run data in the last {timeRange} days. Run some tests to see trends here.
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-card border border-card-border rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Pass Rate Trend</h3>
        <div className="flex gap-1" role="group" aria-label="Time range selector">
          {TIME_RANGES.map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                timeRange === range.value
                  ? 'bg-accent text-white'
                  : 'text-muted hover:bg-card-border hover:text-foreground'
              }`}
              aria-label={`Show ${range.label}`}
              aria-pressed={timeRange === range.value}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-end gap-2 h-40">
        {data.map((d, i) => (
          <div
            key={i}
            className="relative flex-1 flex flex-col items-center gap-1"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => setHoveredIndex(prev => prev === i ? null : i)}
          >
            <AnimatePresence>
              {hoveredIndex === i && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-card border border-card-border rounded-lg shadow-lg p-3 text-sm whitespace-nowrap pointer-events-none"
                  role="tooltip"
                >
                  <p className="font-semibold mb-1">{d.date}</p>
                  <p>Pass Rate: <span className="font-medium">{d.passRate}%</span></p>
                  <p>Total: <span className="font-medium">{d.total}</span></p>
                  <p className="text-emerald-400">Passed: {d.passed}</p>
                  <p className="text-red-400">Failed: {d.failed}</p>
                  {d.skipped > 0 && <p className="text-yellow-400">Skipped: {d.skipped}</p>}
                </motion.div>
              )}
            </AnimatePresence>
            <span className="text-xs text-muted">{d.passRate}%</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${d.passRate}%` }}
              transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
              className={`w-full rounded-t-md cursor-pointer ${d.passRate >= 90 ? 'bg-emerald-500' : d.passRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ minHeight: 4 }}
            />
            <span className="text-[10px] text-muted truncate w-full text-center">{d.date}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
