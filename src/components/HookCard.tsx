import { Clapperboard, RotateCcw, Timer, Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type {
  HookResult,
  HookWindow,
  Platform,
  RewriteDirection,
} from '../types/hooks';
import { estimateSpeakSeconds, speakFit } from '../utils/speakTime';
import { GradeBreakdown } from './GradeBreakdown';
import { RewriteChips } from './RewriteChips';
import { HookActions } from './HookActions';

interface HookCardProps {
  hook: HookResult;
  index: number;
  platform: Platform;
  hookWindow: HookWindow;
  canUndo: boolean;
  isRewriting: boolean;
  isExpanding: boolean;
  expandError?: string;
  onRewrite: (direction: RewriteDirection) => void;
  onUndo: () => void;
  onExpand: () => void;
  saved: boolean;
  onSave: () => void;
}

export function HookCard({
  hook,
  index,
  platform,
  hookWindow,
  canUndo,
  isRewriting,
  isExpanding,
  expandError,
  onRewrite,
  onUndo,
  onExpand,
  saved,
  onSave,
}: HookCardProps) {
  const [contentVisible, setContentVisible] = useState(true);
  const previousTextRef = useRef(hook.text);

  useEffect(() => {
    if (previousTextRef.current === hook.text) {
      return;
    }

    setContentVisible(false);
    previousTextRef.current = hook.text;

    const timeout = window.setTimeout(() => setContentVisible(true), 80);

    return () => window.clearTimeout(timeout);
  }, [hook.text]);

  const speakSeconds = estimateSpeakSeconds(hook.text);
  const fit = speakFit(speakSeconds, hookWindow);
  const fitLabel =
    fit === 'over'
      ? `over ${hookWindow}s window`
      : fit === 'tight'
        ? `tight for ${hookWindow}s`
        : `fits ${hookWindow}s`;

  const cardStyle = hook.best_pick
    ? {
        boxShadow: '0 0 0 1.5px var(--accent-amber), var(--shadow-amber-glow)',
      }
    : undefined;

  return (
    <article
      className="relative flex min-h-[360px] min-w-0 flex-col rounded-md border border-white/10 bg-surface p-5 shadow-panel motion-safe:opacity-0 motion-safe:animate-cardIn"
      style={{ animationDelay: `${index * 40}ms`, ...cardStyle }}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {hook.best_pick ? (
            <p className="mb-2 inline-flex rounded-[3px] border border-amber/40 bg-amber/15 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber">
              Best for {platform}
            </p>
          ) : null}
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-amber">
            {hook.framework}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <p className="inline-flex rounded-[3px] border border-amber/30 bg-amber/10 px-2 py-1 font-mono text-[11px] text-amber">
              {hook.timecode}
            </p>
            <p
              title="Estimated at a typical short-form speaking pace"
              className={`inline-flex items-center gap-1 rounded-[3px] border px-2 py-1 font-mono text-[11px] ${
                fit === 'over'
                  ? 'border-red/40 bg-red/10 text-red'
                  : fit === 'tight'
                    ? 'border-amber/30 bg-amber/10 text-amber'
                    : 'border-cyan/30 bg-cyan/10 text-cyan'
              }`}
            >
              <Timer size={12} aria-hidden="true" />≈{speakSeconds}s spoken ·{' '}
              {fitLabel}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`transition-opacity duration-200 ${
          contentVisible && !isRewriting ? 'opacity-100' : 'opacity-45'
        }`}
      >
        <h2 className="break-words pr-2 font-display text-2xl font-semibold leading-[1.08] text-primary">
          {hook.text}
        </h2>
        <p className="mt-4 text-sm italic leading-6 text-muted">
          <span className="font-semibold text-primary/80">Why it works:</span>{' '}
          {hook.why}
        </p>
        {hook.on_screen_text || hook.visual ? (
          <div className="mt-4 space-y-2 rounded-[4px] border border-white/10 bg-bg/40 p-3 text-sm leading-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              First frame
            </p>
            <dl className="space-y-2">
              {hook.on_screen_text ? (
                <div className="flex gap-2">
                  <dt className="shrink-0 pt-0.5 text-cyan">
                    <Type size={14} aria-label="On-screen text" />
                  </dt>
                  <dd className="font-semibold text-primary">
                    {hook.on_screen_text}
                  </dd>
                </div>
              ) : null}
              {hook.visual ? (
                <div className="flex gap-2">
                  <dt className="shrink-0 pt-0.5 text-cyan">
                    <Clapperboard size={14} aria-label="Visual" />
                  </dt>
                  <dd className="text-secondary">{hook.visual}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <GradeBreakdown scores={hook.scores} />
      </div>

      <div className="mt-auto pt-6">
        <HookActions
          text={hook.text}
          framework={hook.framework}
          platform={platform}
          saved={saved}
          onSave={onSave}
        />
        <div className="mb-3 flex min-h-6 items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Rewrite This One
          </p>
          {canUndo ? (
            <button
              type="button"
              onClick={onUndo}
              className="inline-flex min-h-11 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-amber transition-colors hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
            >
              <RotateCcw size={12} />
              Undo
            </button>
          ) : null}
        </div>
        <RewriteChips disabled={isRewriting} onRewrite={onRewrite} />
        <div className="mt-3">
          <button
            type="button"
            disabled={isExpanding}
            onClick={onExpand}
            className="min-h-11 rounded-[4px] border border-white/10 px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted transition-colors hover:border-cyan/70 hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:cursor-wait disabled:opacity-60"
          >
            {isExpanding ? 'Building outline...' : 'Expand into outline →'}
          </button>
          {expandError ? (
            <p className="mt-2 font-mono text-[11px] leading-5 text-amber">
              {expandError}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
