'use client';

import { useState } from 'react';
import { formatDuration } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface SparklineProps {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({ 
  data, 
  labels = [], 
  width = 80, 
  height = 24, 
  color = '#10b981', 
  className = '' 
}: SparklineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * innerW;
      const y = padding + innerH - ((v - min) / range) * innerH;
      return `${x},${y}`;
    })
    .join(' ');

  // Calculate coordinates for hover targets
  const coordinates = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * innerW;
    const y = padding + innerH - ((v - min) / range) * innerH;
    return { x, y };
  });

  return (
    <div className="relative inline-block">
      <svg
        width={width}
        height={height}
        className={className}
        viewBox={`0 0 ${width} ${height}`}
        aria-label={`Duration trend: ${data.map(d => `${(d / 1000).toFixed(1)}s`).join(', ')}`}
        role="img"
      >
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Invisible hover target circles */}
        {coordinates.map((coord, i) => (
          <circle
            key={i}
            cx={coord.x}
            cy={coord.y}
            r={6}
            fill="transparent"
            stroke="none"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}
        
        {/* Visible dot on the last point */}
        {(() => {
          const lastCoord = coordinates[coordinates.length - 1];
          return <circle cx={lastCoord.x} cy={lastCoord.y} r={2} fill={color} />;
        })()}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-card border border-card-border rounded-lg shadow-lg px-2 py-1 text-xs whitespace-nowrap pointer-events-none"
            role="tooltip"
          >
            <div className="font-medium">{formatDuration(data[hoveredIndex])}</div>
            {labels[hoveredIndex] && (
              <div className="text-muted text-[10px]">{labels[hoveredIndex]}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
