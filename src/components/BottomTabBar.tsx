import { Flame, GitCompareArrows, Scissors } from 'lucide-react';

import { modes, type Mode } from '../types/hooks';

interface BottomTabBarProps {
  mode: Mode;
  disabled?: boolean;
  onChange: (mode: Mode) => void;
}

const tabConfig: Record<
  Mode,
  {
    label: string;
    Icon: typeof Scissors;
  }
> = {
  generate: {
    label: 'Generate',
    Icon: Scissors,
  },
  roast: {
    label: 'Roast',
    Icon: Flame,
  },
  compare: {
    label: 'Compare',
    Icon: GitCompareArrows,
  },
};

export function BottomTabBar({
  mode,
  disabled = false,
  onChange,
}: BottomTabBarProps) {
  return (
    <nav
      aria-label="Primary modes"
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-border bg-surface md:hidden"
    >
      {modes.map((value) => {
        const isSelected = value === mode;
        const { label, Icon } = tabConfig[value];

        return (
          <button
            key={value}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            onClick={() => onChange(value)}
            className={`relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber disabled:cursor-not-allowed disabled:opacity-60 ${
              isSelected ? 'text-amber' : 'text-muted hover:text-cyan'
            }`}
          >
            {isSelected ? (
              <span className="absolute left-1/2 top-0 h-0.5 w-10 -translate-x-1/2 rounded-full bg-amber" />
            ) : null}
            <span className="relative">
              <Icon size={19} aria-hidden="true" />
              {value === 'roast' ? (
                <span
                  className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full border border-amber/40 bg-bg text-amber shadow-amber"
                  aria-label="Popular"
                >
                  <Flame size={10} aria-hidden="true" />
                </span>
              ) : null}
            </span>
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
