import type { HookScores } from '../types/hooks';

interface GradeBreakdownProps {
  scores: HookScores;
}

const scoreItems: Array<{ key: keyof HookScores; label: string }> = [
  { key: 'curiosity', label: 'Curiosity' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'scroll_stop', label: 'Scroll Stop' },
  { key: 'platform_fit', label: 'Platform Fit' },
];

export function GradeBreakdown({ scores }: GradeBreakdownProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {scoreItems.map((item) => {
        const value = scores[item.key];

        return (
          <div key={item.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.12em]">
              <span className="text-muted">{item.label}</span>
              <span className="text-cyan">{value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-cyan/20">
              <div
                className="h-full rounded-full bg-cyan"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
