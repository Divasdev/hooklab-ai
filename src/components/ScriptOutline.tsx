import { Check, Copy, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { ScriptOutline as ScriptOutlineData } from '../types/hooks';

interface ScriptOutlineProps {
  isOpen: boolean;
  outline: ScriptOutlineData | null;
  onClose: () => void;
}

const buildOutlineText = (outline: ScriptOutlineData): string =>
  [
    'SCRIPT OUTLINE',
    '',
    `Hook: "${outline.hook_recap}"`,
    '',
    ...outline.beats.flatMap((beat, index) => [
      `${index + 1}. ${beat.label} (${beat.duration_hint})`,
      beat.description,
      '',
    ]),
    `CTA: ${outline.cta_suggestion}`,
    '',
    'A structure to build your script around - not a finished script.',
  ].join('\n');

export function ScriptOutline({
  isOpen,
  outline,
  onClose,
}: ScriptOutlineProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1500);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen || !outline) {
    return null;
  }

  const copyOutline = async (): Promise<void> => {
    await navigator.clipboard.writeText(buildOutlineText(outline));
    setCopied(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/55 md:items-center md:justify-center motion-reduce:transition-none"
      onMouseDown={(event) => {
        if (
          panelRef.current &&
          !panelRef.current.contains(event.target as Node)
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        className="flex h-[82vh] w-full flex-col overflow-hidden rounded-t-[16px] border border-white/10 bg-surface shadow-panel animate-[cardIn_300ms_cubic-bezier(0.2,0.8,0.2,1)_both] motion-reduce:animate-none md:h-[80vh] md:max-h-[800px] md:w-[640px] md:rounded-[12px]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-surface/95 px-5 py-4 backdrop-blur-md">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-amber">
              Script Outline
            </p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
              &ldquo;{outline.hook_recap}&rdquo;
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close script outline"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[4px] border border-white/10 text-muted transition-colors hover:border-cyan/50 hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="mb-4 rounded-[4px] border border-white/10 bg-black/20 px-3 py-2 text-sm text-muted">
            A structure to build your script around &mdash; not a finished
            script.
          </p>

          <div className="space-y-3">
            {outline.beats.map((beat, index) => (
              <div
                key={`${beat.label}-${index}`}
                className="grid gap-3 rounded-md border border-white/10 bg-black/15 p-4 sm:grid-cols-[2rem_1fr]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-amber/30 bg-amber/10 font-mono text-xs font-semibold text-amber">
                  {index + 1}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
                      {beat.label}
                    </p>
                    <p className="font-mono text-[11px] text-muted">
                      {beat.duration_hint}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-primary/90">
                    {beat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-md border border-cyan/20 bg-cyan/10 p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cyan">
              CTA
            </p>
            <p className="mt-2 text-sm leading-6 text-primary/90">
              {outline.cta_suggestion}
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={() => {
              void copyOutline();
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-[4px] border border-white/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted transition-colors hover:border-cyan/60 hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy Outline'}
          </button>
        </div>
      </div>
    </div>
  );
}
