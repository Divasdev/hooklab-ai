import { modes, type Mode } from '../types/hooks';

interface ModeToggleProps {
  mode: Mode;
  disabled?: boolean;
  onChange: (mode: Mode) => void;
}

const modeLabels: Record<Mode, string> = {
  generate: 'Generate Hooks',
  roast: 'Roast My Hook',
  compare: 'Compare Hooks',
};

export function ModeToggle({
  mode,
  disabled = false,
  onChange,
}: ModeToggleProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
      {modes.map((value) => {
        const isSelected = value === mode;

        let selectedClasses = '';
        if (value === 'roast') {
          selectedClasses = 'bg-red text-bg shadow-amber';
        } else if (value === 'compare') {
          selectedClasses = 'bg-cyan text-bg shadow-cyan';
        } else {
          selectedClasses = 'bg-amber text-bg shadow-amber';
        }

        return (
          <button
            key={value}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            onClick={() => onChange(value)}
            className={`relative min-h-11 flex-1 rounded-md px-3 py-2 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:cursor-not-allowed disabled:opacity-60 ${
              isSelected
                ? selectedClasses
                : 'text-muted hover:bg-white/5 hover:text-cyan'
            }`}
          >
            {modeLabels[value]}
            {value === 'roast' ? (
              <span className="absolute -right-1 -top-2 grid h-5 w-5 place-items-center rounded-full border border-amber/40 bg-bg text-amber shadow-amber">
                <span className="sr-only">Popular</span>
                🔥
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
