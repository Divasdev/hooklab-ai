import { platforms, type Platform } from '../types/hooks';

interface PlatformSelectorProps {
  selectedPlatform: Platform;
  onChange: (platform: Platform) => void;
  disabled?: boolean;
}

export function PlatformSelector({
  selectedPlatform,
  onChange,
  disabled = false,
}: PlatformSelectorProps) {
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
        Platform
      </legend>
      <div className="grid rounded-md border border-white/10 bg-black/20 p-1 sm:grid-cols-3">
        {platforms.map((platform) => {
          const isSelected = platform === selectedPlatform;

          return (
            <button
              key={platform}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(platform)}
              className={`min-h-11 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? 'bg-amber text-bg shadow-amber'
                  : 'text-primary hover:bg-white/5 hover:text-cyan'
              }`}
            >
              {platform}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
