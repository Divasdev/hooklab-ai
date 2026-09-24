import { platforms, type Platform } from '../types/hooks';

const shortNames: Record<Platform, string> = {
  'YouTube Shorts': 'Shorts',
  'Instagram Reels': 'Reels',
  TikTok: 'TikTok',
};

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
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-xs font-medium text-muted">Platform</legend>
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
        {platforms.map((platform) => {
          const isSelected = platform === selectedPlatform;

          return (
            <button
              key={platform}
              type="button"
              aria-pressed={isSelected}
              aria-label={platform}
              onClick={() => onChange(platform)}
              className={`min-h-11 rounded-md px-2 text-sm font-semibold transition active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? 'bg-amber text-bg shadow-amber'
                  : 'text-secondary hover:bg-white/5 hover:text-cyan'
              }`}
            >
              <span className="sm:hidden">{shortNames[platform]}</span>
              <span className="hidden sm:inline">{platform}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
