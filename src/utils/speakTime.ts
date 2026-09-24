import type { HookWindow } from '../types/hooks';

// Short-form delivery runs faster than conversational speech (~170 wpm).
const wordsPerSecond = 2.8;
const pauseSeconds = 0.3;

/** Estimates how long a hook takes to say aloud, in seconds (one decimal). */
export const estimateSpeakSeconds = (text: string): number => {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean).length;

  if (words === 0) {
    return 0;
  }

  // Sentence breaks and dashes inside the line add a beat; the final one does not.
  const pauses = (trimmed.match(/[.!?।…—]+\s+(?=\S)/g) ?? []).length;

  return Math.round((words / wordsPerSecond + pauses * pauseSeconds) * 10) / 10;
};

export type SpeakFit = 'fits' | 'tight' | 'over';

export const speakFit = (seconds: number, hookWindow: HookWindow): SpeakFit => {
  if (seconds > hookWindow) return 'over';
  if (seconds > hookWindow * 0.85) return 'tight';
  return 'fits';
};
