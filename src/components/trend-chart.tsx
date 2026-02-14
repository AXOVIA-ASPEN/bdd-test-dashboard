'use client';
import { motion } from 'framer-motion';
import { useDashboardStore } from '@/store/use-dashboard-store';

export function TrendChart() {
  const data = useDashboardStore(s => s.getTrendData(14));
  if (data.length === 0) return null;
  const max = 100;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-card border border-card-border rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold mb-4">Pass Rate Trend</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-muted">{d.passRate}%</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d.passRate / max) * 100}%` }}
              transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
              className={`w-full rounded-t-md ${d.passRate >= 90 ? 'bg-emerald-500' : d.passRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ minHeight: 4 }}
            />
            <span className="text-[10px] text-muted truncate w-full text-center">{d.date}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
