import {
  audiences,
  hookWindows,
  intensities,
  languages,
  modes,
  platforms,
  tones,
  type Audience,
  type HookLanguage,
  type HookWindow,
  type Intensity,
  type Mode,
  type Platform,
  type Tone,
} from '../types/hooks';

export const draftKey = 'hooklab_draft';

export interface Draft {
  script: string;
  hookB: string;
  platform: Platform;
  tone: Tone;
  audience: Audience;
  intensity: Intensity;
  language: HookLanguage;
  hookWindow: HookWindow;
  mode: Mode;
}

export const defaultDraft: Draft = {
  script: '',
  hookB: '',
  platform: 'YouTube Shorts',
  tone: 'Punchy',
  audience: 'Creators',
  intensity: 'Sharp',
  language: 'English',
  hookWindow: 5,
  mode: 'generate',
};

const pick = <T>(allowed: readonly T[], value: unknown, fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

// Each field falls back on its own, so one stale value never discards the script.
export const parseDraft = (raw: string | null): Draft => {
  if (!raw) return defaultDraft;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return defaultDraft;
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return defaultDraft;
  }

  const record = value as Record<string, unknown>;
  const text = (field: unknown): string =>
    typeof field === 'string' ? field.slice(0, 3000) : '';

  return {
    script: text(record.script),
    hookB: text(record.hookB),
    platform: pick(platforms, record.platform, defaultDraft.platform),
    tone: pick(tones, record.tone, defaultDraft.tone),
    audience: pick(audiences, record.audience, defaultDraft.audience),
    intensity: pick(intensities, record.intensity, defaultDraft.intensity),
    language: pick(languages, record.language, defaultDraft.language),
    hookWindow: pick(hookWindows, record.hookWindow, defaultDraft.hookWindow),
    mode: pick(modes, record.mode, defaultDraft.mode),
  };
};

export const readDraft = (): Draft => {
  try {
    return parseDraft(window.localStorage.getItem(draftKey));
  } catch {
    return defaultDraft;
  }
};

export const writeDraft = (draft: Draft): void => {
  try {
    window.localStorage.setItem(draftKey, JSON.stringify(draft));
  } catch {
    /* Drafts are a convenience; the editor keeps working without storage. */
  }
};
