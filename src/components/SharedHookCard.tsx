import { Flame, Scissors } from 'lucide-react';

import type { SharedHook } from '../utils/shareLink';

interface SharedHookCardProps {
  hook: SharedHook;
  onRoast: () => void;
  onDismiss: () => void;
}

export function SharedHookCard({
  hook,
  onRoast,
  onDismiss,
}: SharedHookCardProps) {
  return (
    <article className="rounded-md border border-white/10 bg-surface p-6 shadow-panel motion-safe:animate-cardIn">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        Someone shared a hook with you
      </p>
      {hook.framework ? (
        <p className="mt-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-amber">
          {hook.framework}
        </p>
      ) : null}
      <h2 className="mt-2 break-words font-display text-3xl font-semibold leading-[1.08] text-primary">
        {hook.text}
      </h2>
      <p className="mt-3 font-mono text-xs text-cyan">{hook.platform}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRoast}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-red px-4 font-display text-sm font-semibold text-bg hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
        >
          <Flame size={16} aria-hidden="true" />
          Roast this hook
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/10 px-4 font-display text-sm font-semibold text-primary hover:border-amber/60 hover:text-amber focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
        >
          <Scissors size={16} aria-hidden="true" />
          Cut hooks for my own script
        </button>
      </div>
    </article>
  );
}
