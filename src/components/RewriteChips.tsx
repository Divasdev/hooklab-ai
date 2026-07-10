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
          className="min-h-11 rounded-[4px] border border-white/10 px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted transition-colors hover:border-amber/70 hover:text-amber focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:cursor-not-allowed disabled:opacity-50"
        >
          {direction}
        </button>
      ))}
    </div>
  );
}
