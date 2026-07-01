import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { HookResult } from '../types/hooks';
import { Sparkline } from './Sparkline';

interface HookCardProps {
  hook: HookResult;
  index: number;
}

export function HookCard({ hook, index }: HookCardProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1500);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copyHook = async (): Promise<void> => {
    await navigator.clipboard.writeText(hook.text);
    setCopied(true);
  };

  return (
    <article
      className="relative min-h-[270px] rounded-md border border-white/10 bg-surface p-5 shadow-panel opacity-0 motion-safe:animate-cardIn"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-amber">
            {hook.framework}
          </p>
          <p className="mt-2 inline-flex rounded-[3px] border border-amber/30 bg-amber/10 px-2 py-1 font-mono text-[11px] text-amber">
            {hook.timecode}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void copyHook();
          }}
          aria-label={copied ? 'Hook copied' : 'Copy hook'}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[4px] border border-white/10 text-muted transition-colors hover:border-cyan/50 hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>
      <h2 className="pr-2 font-display text-[clamp(1.45rem,4.8vw,2.05rem)] font-semibold leading-[1.08] text-primary">
        {hook.text}
      </h2>
      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em]">
          <span className="text-muted">Hook Strength</span>
          <span className="text-cyan">{hook.strength}</span>
        </div>
        <Sparkline strength={hook.strength} />
      </div>
    </article>
  );
}
