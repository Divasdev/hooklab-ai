import {
  Bookmark,
  Check,
  Clapperboard,
  Copy,
  FileText,
  ImageDown,
  Link2,
  LoaderCircle,
  MoreHorizontal,
  RotateCcw,
  Timer,
  Type,
  Wand2,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import type {
  HookResult,
  HookWindow,
  Platform,
  RewriteDirection,
} from '../types/hooks';
import { estimateSpeakSeconds, speakFit } from '../utils/speakTime';
import { GradeBreakdown } from './GradeBreakdown';
import { useHookActions } from '../hooks/useHookActions';
import { Reveal } from './Reveal';
import { RewriteChips } from './RewriteChips';

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

type Panel = 'rewrite' | 'more' | null;

const iconButton =
  'grid h-11 w-11 shrink-0 place-items-center rounded-md border border-white/10 text-muted transition hover:border-cyan/50 hover:text-cyan active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber';
const menuButton =
  'inline-flex min-h-11 items-center gap-2 rounded-md border border-white/10 px-3 text-sm text-secondary transition hover:border-cyan/50 hover:text-cyan active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:cursor-wait disabled:opacity-60';

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
  const [panel, setPanel] = useState<Panel>(null);
  const previousTextRef = useRef(hook.text);
  const panelId = useId();
  const actions = useHookActions({
    text: hook.text,
    framework: hook.framework,
    platform,
  });

  useEffect(() => {
    if (previousTextRef.current === hook.text) {
      return;
    }

    setContentVisible(false);
    previousTextRef.current = hook.text;

    const timeout = window.setTimeout(() => setContentVisible(true), 80);

    return () => window.clearTimeout(timeout);
  }, [hook.text]);

  const togglePanel = (next: Exclude<Panel, null>): void =>
    setPanel((current) => (current === next ? null : next));

  const speakSeconds = estimateSpeakSeconds(hook.text);
  const fit = speakFit(speakSeconds, hookWindow);
  const fitLabel =
    fit === 'over'
      ? `over ${hookWindow}s`
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
      className="relative flex min-w-0 flex-col rounded-lg border border-white/10 bg-surface p-4 shadow-panel motion-safe:opacity-0 motion-safe:animate-cardIn sm:p-5"
      style={{ animationDelay: `${index * 40}ms`, ...cardStyle }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        {hook.best_pick ? (
          <p className="rounded-full bg-amber px-2.5 py-0.5 text-[11px] font-semibold text-bg">
            Best pick
          </p>
        ) : null}
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
          {hook.framework}
        </p>
        <p
          title={`Estimated at a typical short-form speaking pace. Window: ${hook.timecode}`}
          className={`ml-auto inline-flex items-center gap-1 font-mono text-[11px] ${
            fit === 'over'
              ? 'text-red'
              : fit === 'tight'
                ? 'text-amber'
                : 'text-cyan'
          }`}
        >
          <Timer size={12} aria-hidden="true" />≈{speakSeconds}s · {fitLabel}
        </p>
      </div>

      <div
        className={`transition-opacity duration-200 ${
          contentVisible && !isRewriting ? 'opacity-100' : 'opacity-45'
        }`}
      >
        <h2 className="break-words font-display text-xl font-semibold leading-[1.15] text-primary sm:text-2xl sm:leading-[1.1]">
          {hook.text}
        </h2>
        <p className="mt-3 text-sm leading-6 text-secondary">{hook.why}</p>
        {hook.on_screen_text || hook.visual ? (
          <div className="mt-4 space-y-2 rounded-md border border-white/10 bg-bg/40 p-3 text-sm leading-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
              First frame
            </p>
            <dl className="space-y-1.5">
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

      <div className="mt-4">
        <GradeBreakdown scores={hook.scores} showNote={false} />
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void actions.copy()}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-amber px-4 text-sm font-semibold text-bg transition hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          >
            {actions.copied ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <Copy size={16} aria-hidden="true" />
            )}
            {actions.copied ? (
              'Copied'
            ) : (
              <>
                Copy<span className="hidden sm:inline">&nbsp;hook</span>
              </>
            )}
          </button>
          <button
            type="button"
            className={iconButton}
            title={saved ? 'Remove from saved hooks' : 'Save hook'}
            aria-label={saved ? 'Remove from saved hooks' : 'Save hook'}
            aria-pressed={saved}
            onClick={onSave}
          >
            <Bookmark
              size={17}
              className={saved ? 'fill-amber text-amber' : ''}
            />
          </button>
          <button
            type="button"
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber ${
              panel === 'rewrite'
                ? 'border-amber/60 text-amber'
                : 'border-white/10 text-secondary hover:border-cyan/50 hover:text-cyan'
            }`}
            title="Rewrite this hook"
            aria-expanded={panel === 'rewrite'}
            aria-controls={`${panelId}-rewrite`}
            onClick={() => togglePanel('rewrite')}
          >
            {isRewriting ? (
              <LoaderCircle
                size={16}
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Wand2 size={16} aria-hidden="true" />
            )}
            Rewrite
          </button>
          <button
            type="button"
            className={`${iconButton} ${panel === 'more' ? 'border-cyan/60 text-cyan' : ''}`}
            title="More actions"
            aria-label="More actions"
            aria-expanded={panel === 'more'}
            aria-controls={`${panelId}-more`}
            onClick={() => togglePanel('more')}
          >
            <MoreHorizontal
              size={18}
              className={`transition-transform duration-200 ${panel === 'more' ? 'rotate-90' : ''}`}
            />
          </button>
        </div>

        <Reveal open={panel === 'rewrite'} id={`${panelId}-rewrite`}>
          <div className="pt-3">
            <div className="mb-2 flex min-h-6 items-center justify-between gap-3">
              <p className="text-xs text-muted">Rewrite it to be…</p>
              {canUndo ? (
                <button
                  type="button"
                  onClick={onUndo}
                  className="inline-flex min-h-11 items-center gap-1 text-xs text-amber transition-colors hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
                >
                  <RotateCcw size={12} aria-hidden="true" />
                  Undo rewrite
                </button>
              ) : null}
            </div>
            <RewriteChips disabled={isRewriting} onRewrite={onRewrite} />
          </div>
        </Reveal>

        <Reveal open={panel === 'more'} id={`${panelId}-more`}>
          <div className="flex flex-wrap gap-2 pt-3">
            <button
              type="button"
              className={menuButton}
              onClick={() => void actions.share()}
            >
              {actions.linkCopied ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <Link2 size={15} aria-hidden="true" />
              )}
              {actions.linkCopied ? 'Link copied' : 'Share link'}
            </button>
            <button
              type="button"
              className={menuButton}
              disabled={actions.exporting}
              onClick={actions.downloadImage}
            >
              {actions.exporting ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <ImageDown size={15} aria-hidden="true" />
              )}
              Save as image
            </button>
            <button
              type="button"
              className={menuButton}
              disabled={isExpanding}
              onClick={onExpand}
            >
              {isExpanding ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <FileText size={15} aria-hidden="true" />
              )}
              {isExpanding ? 'Building outline…' : 'Turn into script outline'}
            </button>
          </div>
        </Reveal>

        {canUndo && panel !== 'rewrite' ? (
          <button
            type="button"
            onClick={onUndo}
            className="mt-2 inline-flex min-h-11 items-center gap-1 text-xs text-amber transition-colors hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          >
            <RotateCcw size={12} aria-hidden="true" />
            Undo rewrite
          </button>
        ) : null}
        {actions.error || expandError ? (
          <p role="alert" className="mt-2 text-xs leading-5 text-amber">
            {actions.error || expandError}
          </p>
        ) : null}
      </div>
    </article>
  );
}
