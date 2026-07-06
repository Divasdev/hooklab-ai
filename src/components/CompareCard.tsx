import { Check, ChevronDown, Copy, Trophy } from 'lucide-react';
import { useState } from 'react';

import type { CompareHooksResponse } from '../types/hooks';

interface CompareCardProps {
  compare: CompareHooksResponse;
  hookA: string;
  hookB: string;
}

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-surface">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 border-b border-white/5 bg-black/20 px-6 py-4 text-left transition-colors hover:bg-black/30"
      >
        <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
          {title}
        </h3>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`transition-all duration-200 ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 overflow-hidden opacity-0'
        }`}
      >
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function CompareCard({ compare, hookA, hookB }: CompareCardProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(compare.improvedHook);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore copy errors
    }
  };

  const metrics = [
    { name: 'Clarity', data: compare.analysis.clarity },
    { name: 'Curiosity', data: compare.analysis.curiosity },
    { name: 'Emotion', data: compare.analysis.emotion },
    { name: 'Retention', data: compare.analysis.retention },
  ];

  return (
    <div className="space-y-4">
      {/* Winner — always expanded */}
      <CollapsibleSection title="Winner" defaultOpen>
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan/15 text-cyan">
            <Trophy size={28} />
          </div>
          <div className="mb-2 font-mono text-sm tracking-widest text-cyan uppercase">
            Winner: Hook {compare.winner}
          </div>
          <div className="mb-4 font-display text-3xl font-bold text-primary">
            {compare.confidence}% Confidence
          </div>
          <p className="max-w-md text-base text-primary/90">{compare.summary}</p>
        </div>
      </CollapsibleSection>

      {/* Hook A — collapsed */}
      <CollapsibleSection title="Hook A">
        <p className="text-sm leading-6 text-primary">
          &ldquo;{hookA}&rdquo;
        </p>
      </CollapsibleSection>

      {/* Hook B — collapsed */}
      <CollapsibleSection title="Hook B">
        <p className="text-sm leading-6 text-primary">
          &ldquo;{hookB}&rdquo;
        </p>
      </CollapsibleSection>

      {/* Score Breakdown — collapsed */}
      <CollapsibleSection title="Score Breakdown">
        <div className="divide-y divide-white/5">
          {metrics.map((metric) => (
            <div
              key={metric.name}
              className="grid gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[120px_60px_1fr] sm:items-center"
            >
              <div className="font-semibold text-primary">{metric.name}</div>
              <div className="flex justify-center">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm font-bold ${
                    metric.data.winner === compare.winner
                      ? 'bg-cyan/15 text-cyan'
                      : 'bg-white/10 text-muted'
                  }`}
                >
                  {metric.data.winner}
                </span>
              </div>
              <div className="text-sm text-muted">{metric.data.reason}</div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Improved Hook */}
      <div className="rounded-xl border border-cyan/20 bg-black/40 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-cyan">
            Improved Final Hook
          </h3>
          <button
            type="button"
            onClick={() => {
              void copyToClipboard();
            }}
            className="flex items-center gap-2 rounded text-xs font-semibold text-cyan/70 transition-colors hover:text-cyan"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="font-display text-xl leading-relaxed text-primary">
          {compare.improvedHook}
        </p>
      </div>
    </div>
  );
}
