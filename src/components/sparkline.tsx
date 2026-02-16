'use client';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({ data, width = 80, height = 24, color = '#10b981', className = '' }: SparklineProps) {
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

  return (
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
      {/* Dot on the last point */}
      {(() => {
        const lastX = padding + ((data.length - 1) / (data.length - 1)) * innerW;
        const lastY = padding + innerH - ((data[data.length - 1] - min) / range) * innerH;
        return <circle cx={lastX} cy={lastY} r={2} fill={color} />;
      })()}
    </svg>
  );
}
