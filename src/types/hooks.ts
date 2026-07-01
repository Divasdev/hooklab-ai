export const platforms = [
  'YouTube Shorts',
  'Instagram Reels',
  'TikTok',
] as const;

export type Platform = (typeof platforms)[number];

export const tones = ['Punchy', 'Clean', 'Controversial', 'Story'] as const;

export type Tone = (typeof tones)[number];

export const audiences = [
  'Beginners',
  'Creators',
  'Business',
  'Fitness',
  'Finance',
] as const;

export type Audience = (typeof audiences)[number];

export const intensities = ['Safe', 'Sharp', 'Aggressive'] as const;

export type Intensity = (typeof intensities)[number];

export const languages = ['English', 'Hinglish', 'Hindi'] as const;

export type HookLanguage = (typeof languages)[number];

export const hookWindows = [5, 8] as const;

export type HookWindow = (typeof hookWindows)[number];

export const modes = ['generate', 'roast', 'compare'] as const;

export type Mode = (typeof modes)[number];

export type HookTimecode = '00:00–00:05' | '00:00–00:08';

export const hookWindowTimecodes: Record<HookWindow, HookTimecode> = {
  5: '00:00–00:05',
  8: '00:00–00:08',
};

export const hookFrameworks = [
  'CURIOSITY GAP',
  'BOLD CLAIM',
  'PATTERN INTERRUPT',
  'STORY OPEN',
  'CONTROVERSY',
  'STAT SHOCK',
  'DIRECT CALLOUT',
  'COLD OPEN',
  'QUESTION HOOK',
  'STAKES FIRST',
] as const;

export type HookFramework = (typeof hookFrameworks)[number];

export const rewriteDirections = [
  'Shorter',
  'More Emotional',
  'More Controversial',
  'Clearer',
  'Less Clickbait',
] as const;

export type RewriteDirection = (typeof rewriteDirections)[number];

export interface HookScores {
  curiosity: number;
  clarity: number;
  scroll_stop: number;
  platform_fit: number;
}

export interface HookResult {
  framework: HookFramework;
  text: string;
  why: string;
  timecode: HookTimecode;
  scores: HookScores;
  best_pick: boolean;
}

export interface RoastCritique {
  grade: string;
  bullets: string[];
  biggest_fix: string;
}

export interface GenerateHooksRequest {
  script: string;
  hookB?: string;
  platform: Platform;
  tone: Tone;
  audience: Audience;
  intensity: Intensity;
  language: HookLanguage;
  hookWindow: HookWindow;
  mode: Mode;
}

export interface CompareAnalysis {
  winner: 'A' | 'B';
  reason: string;
}

export interface CompareHooksResponse {
  winner: 'A' | 'B';
  confidence: number;
  summary: string;
  analysis: {
    clarity: CompareAnalysis;
    curiosity: CompareAnalysis;
    emotion: CompareAnalysis;
    retention: CompareAnalysis;
  };
  improvedHook: string;
}

export type GenerateHooksResponse =
  | {
      mode: 'generate';
      hooks: HookResult[];
    }
  | {
      mode: 'roast';
      hooks: HookResult[];
      roast: RoastCritique;
    }
  | {
      mode: 'compare';
      compare: CompareHooksResponse;
    };

export interface RewriteHookRequest {
  hook: string;
  framework: HookFramework;
  direction: RewriteDirection;
  platform: Platform;
  hookWindow: HookWindow;
}

export interface RewriteHookResponse {
  text: string;
  why: string;
  scores: HookScores;
}

export interface HistoryEntry extends GenerateHooksRequest {
  id: string;
  timestamp: number;
  hooks?: HookResult[];
  roast?: RoastCritique;
  compare?: CompareHooksResponse;
}
