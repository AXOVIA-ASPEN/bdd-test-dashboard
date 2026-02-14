'use client';
import { motion } from 'framer-motion';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { CheckCircle2, XCircle, SkipForward, Activity } from 'lucide-react';

const cards = [
  { key: 'total' as const, label: 'Total Tests', icon: Activity, color: 'text-accent', suffix: '' },
  { key: 'passRate' as const, label: 'Pass Rate', icon: CheckCircle2, color: 'text-emerald-400', suffix: '%' },
  { key: 'failed' as const, label: 'Failures', icon: XCircle, color: 'text-red-400', suffix: '' },
  { key: 'skipped' as const, label: 'Skipped', icon: SkipForward, color: 'text-yellow-400', suffix: '' },
];

export function SummaryCards() {
  const summary = useDashboardStore(s => s.getGlobalSummary());
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-card border border-card-border rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted">{card.label}</span>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <p className="text-3xl font-bold">
            {summary[card.key]}{card.suffix || ''}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
