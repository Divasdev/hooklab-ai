import type { HookResult } from '../types/hooks';

interface PreviewHookCardProps {
  hook: HookResult;
}

// Read-only card for a hook that has streamed in before the full set is checked.
export function PreviewHookCard({ hook }: PreviewHookCardProps) {
  return (
    <article className="flex min-w-0 flex-col rounded-lg border border-white/10 bg-surface p-4 shadow-panel motion-safe:animate-cardIn sm:p-5">
      <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
        {hook.framework}
      </p>
      <h2 className="break-words font-display text-xl font-semibold leading-[1.15] text-primary sm:text-2xl sm:leading-[1.1]">
        {hook.text}
      </h2>
      <p className="mt-3 text-sm leading-6 text-secondary">{hook.why}</p>
      <p className="mt-4 text-xs text-muted">Scoring and checking…</p>
    </article>
  );
}
