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
  timecode: '00:00–00:05';
  scores: HookScores;
  best_pick: boolean;
}

export interface GenerateHooksRequest {
  script: string;
  platform: Platform;
  tone: Tone;
  audience: Audience;
  intensity: Intensity;
  language: HookLanguage;
}

export interface GenerateHooksResponse {
  hooks: HookResult[];
}

export interface RewriteHookRequest {
  hook: string;
  framework: HookFramework;
  direction: RewriteDirection;
  platform: Platform;
}

export interface RewriteHookResponse {
  text: string;
  why: string;
  scores: HookScores;
}

export interface HistoryEntry extends GenerateHooksRequest {
  id: string;
  timestamp: number;
  hooks: HookResult[];
}
