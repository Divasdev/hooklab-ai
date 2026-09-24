import { Clapperboard, Mic, RotateCcw, Square, Type, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDialogFocus } from '../hooks/useDialogFocus';
import type { HookResult, HookWindow } from '../types/hooks';
import { speakFit } from '../utils/speakTime';

interface SayItPracticeProps {
  hook: HookResult | null;
  hookWindow: HookWindow;
  onClose: () => void;
  onPracticed?: (fit: ReturnType<typeof speakFit>) => void;
}

type Phase = 'ready' | 'countdown' | 'speaking' | 'done';

const countdownFrom = 3;

// Teleprompter plus stopwatch: read the hook aloud and see if it fits the window.
export function SayItPractice({
  hook,
  hookWindow,
  onClose,
  onPracticed,
}: SayItPracticeProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [count, setCount] = useState(countdownFrom);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  const frame = useRef(0);
  const isOpen = hook !== null;

  const close = useCallback(() => {
    cancelAnimationFrame(frame.current);
    setPhase('ready');
    setElapsed(0);
    onClose();
  }, [onClose]);

  useDialogFocus(isOpen, panelRef, close);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count === 0) {
      startedAt.current = performance.now();
      setPhase('speaking');
      return;
    }
    const timer = window.setTimeout(() => setCount((value) => value - 1), 700);
    return () => window.clearTimeout(timer);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== 'speaking') return;
    const tick = (): void => {
      const seconds = (performance.now() - startedAt.current) / 1000;
      setElapsed(seconds);
      // Stop on its own well past the window so a forgotten run doesn't spin.
      if (seconds >= hookWindow * 3) {
        setPhase('done');
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [phase, hookWindow]);

  if (!hook) return null;

  const start = (): void => {
    setElapsed(0);
    setCount(countdownFrom);
    setPhase('countdown');
  };

  const finish = (): void => {
    cancelAnimationFrame(frame.current);
    const seconds = (performance.now() - startedAt.current) / 1000;
    setElapsed(seconds);
    setPhase('done');
    onPracticed?.(speakFit(seconds, hookWindow));
  };

  const rounded = Math.round(elapsed * 10) / 10;
  const fit = speakFit(elapsed, hookWindow);
  const progress = Math.min(elapsed / hookWindow, 1);
  const over = elapsed > hookWindow;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 md:items-center md:p-6">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Practice saying this hook"
        className="flex w-full max-w-2xl flex-col bg-surface p-5 shadow-panel motion-safe:animate-cardIn md:rounded-xl md:border md:border-white/10 md:p-8"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-primary">
            Say it out loud · {hookWindow} sec window
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Close practice"
            className="grid h-11 w-11 place-items-center rounded-md border border-white/10 text-muted transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-center py-8">
          {hook.on_screen_text ? (
            <p className="mb-4 inline-flex items-center gap-2 self-start rounded-md bg-bg/60 px-3 py-1.5 text-sm font-semibold text-cyan">
              <Type size={14} aria-hidden="true" />
              {hook.on_screen_text}
            </p>
          ) : null}
          <p
            className={`break-words font-display text-[clamp(1.75rem,6vw,2.75rem)] font-semibold leading-[1.1] transition-colors ${
              phase === 'speaking' ? 'text-primary' : 'text-primary/85'
            }`}
          >
            {hook.text}
          </p>
          {hook.visual ? (
            <p className="mt-4 flex gap-2 text-sm leading-6 text-secondary">
              <Clapperboard
                size={15}
                className="mt-1 shrink-0 text-cyan"
                aria-hidden="true"
              />
              {hook.visual}
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          <div
            className="h-2 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="Time used"
            aria-valuemin={0}
            aria-valuemax={hookWindow}
            aria-valuenow={rounded}
          >
            <div
              className={`h-full rounded-full ${over ? 'bg-red' : 'bg-amber'}`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div aria-live="polite" className="min-h-12 text-center">
            {phase === 'ready' ? (
              <p className="text-sm text-muted">
                Tap start, wait for the countdown, then read the line like you
                would on camera.
              </p>
            ) : phase === 'countdown' ? (
              <p className="font-display text-4xl font-semibold text-amber">
                {count > 0 ? count : 'Go'}
              </p>
            ) : phase === 'speaking' ? (
              <p
                className={`font-mono text-3xl ${over ? 'text-red' : 'text-primary'}`}
              >
                {rounded.toFixed(1)}s
              </p>
            ) : (
              <p className="text-base text-primary">
                <span
                  className={`font-mono text-2xl font-semibold ${
                    fit === 'over'
                      ? 'text-red'
                      : fit === 'tight'
                        ? 'text-amber'
                        : 'text-cyan'
                  }`}
                >
                  {rounded.toFixed(1)}s
                </span>
                <span className="mt-1 block text-sm text-secondary">
                  {fit === 'over'
                    ? `${(rounded - hookWindow).toFixed(1)}s over. Try the "Shorter" rewrite or speed up the opening words.`
                    : fit === 'tight'
                      ? 'Fits, but only just. Leave room for a beat before the next line.'
                      : 'Fits with room to spare.'}
                </span>
              </p>
            )}
          </div>

          {phase === 'speaking' ? (
            <button
              type="button"
              onClick={finish}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 font-display text-base font-semibold text-bg transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
            >
              <Square size={16} aria-hidden="true" />
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={phase === 'countdown'}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-amber px-5 font-display text-base font-semibold text-bg transition hover:brightness-110 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:opacity-60"
            >
              {phase === 'done' ? (
                <RotateCcw size={16} aria-hidden="true" />
              ) : (
                <Mic size={16} aria-hidden="true" />
              )}
              {phase === 'done' ? 'Try again' : 'Start'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
