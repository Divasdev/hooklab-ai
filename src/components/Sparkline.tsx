interface SparklineProps {
  strength: number;
  animate?: boolean;
  muted?: boolean;
}

const clamp = (value: number): number => Math.max(0, Math.min(100, value));

const buildPoints = (strength: number): string => {
  const score = clamp(strength);
  const lift = score / 100;
  const points = [
    [4, 48],
    [24, 48 - lift * 10],
    [44, 50 - lift * 24],
    [64, 42 - lift * 28],
    [84, 36 - lift * 18],
    [104, 30 - lift * 34],
    [124, 26 - lift * 22],
    [144, 18 - lift * 12],
  ];

  return points.map(([x, y]) => `${x},${Math.max(8, y)}`).join(' ');
};

export function Sparkline({
  strength,
  animate = true,
  muted = false,
}: SparklineProps) {
  const points = muted
    ? '4,42 24,42 44,42 64,42 84,42 104,42 124,42 144,42'
    : buildPoints(strength);

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 148 58"
      className="h-16 w-full overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id={`spark-glow-${muted ? 'muted' : strength}`}>
          <feGaussianBlur stdDeviation="2.2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <line
        x1="4"
        x2="144"
        y1="48"
        y2="48"
        stroke="rgba(242, 240, 234, 0.12)"
        strokeWidth="1"
      />
      <polyline
        points={points}
        fill="none"
        stroke={muted ? 'rgba(120, 124, 135, 0.62)' : 'var(--accent-cyan)'}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        strokeDasharray="260"
        strokeDashoffset={animate && !muted ? 260 : 0}
        filter={muted ? undefined : `url(#spark-glow-${strength})`}
        className={animate && !muted ? 'motion-safe:animate-drawLine' : ''}
      />
    </svg>
  );
}
