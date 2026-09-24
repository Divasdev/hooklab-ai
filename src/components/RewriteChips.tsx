import { rewriteDirections, type RewriteDirection } from '../types/hooks';

interface RewriteChipsProps {
  disabled?: boolean;
  onRewrite: (direction: RewriteDirection) => void;
}

export function RewriteChips({
  disabled = false,
  onRewrite,
}: RewriteChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {rewriteDirections.map((direction) => (
        <button
          key={direction}
          type="button"
          disabled={disabled}
          onClick={() => onRewrite(direction)}
          className="min-h-11 rounded-full border border-white/10 px-3.5 text-sm text-secondary transition hover:border-amber/70 hover:text-amber active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:cursor-not-allowed disabled:opacity-50"
        >
          {direction}
        </button>
      ))}
    </div>
  );
}
