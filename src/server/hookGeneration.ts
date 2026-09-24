import {
  audiences,
  hookFrameworks,
  hookWindowTimecodes,
  hookWindows,
  intensities,
  languages,
  modes,
  platforms,
  rewriteDirections,
  tones,
  type Audience,
  type CompareHooksResponse,
  type CompareAnalysis,
  type GenerateHooksRequest,
  type GenerateHooksResponse,
  type HookFramework,
  type HookLanguage,
  type HookResult,
  type HookScores,
  type HookTimecode,
  type HookWindow,
  type Intensity,
  type Mode,
  type Platform,
  type RewriteDirection,
  type RewriteHookRequest,
  type RewriteHookResponse,
  type RoastCritique,
  type Tone,
} from '../types/hooks.js';
import {
  compareSchema,
  hooksSchema,
  rewriteSchema,
  roastSchema,
  type GeminiSchema,
} from './geminiSchemas.js';
import { extractTopicAnchors, isGenerationGrounded } from './relevance.js';

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

/** Progress events for streaming clients; the final result is still returned. */
export type GenerateStreamEvent =
  { type: 'hook'; hook: HookResult } | { type: 'reset' };

export interface GenerateHooksHandlerOptions {
  apiKeys: string[];
  body: unknown;
  ip?: string;
  model?: string;
  onEvent?: (event: GenerateStreamEvent) => void;
}

export interface RewriteHookHandlerOptions {
  apiKeys: string[];
  body: unknown;
  ip?: string;
  model?: string;
}

export interface HandlerResult<TPayload> {
  status: number;
  payload: TPayload | { error: string };
}

export const defaultGeminiModel = 'gemini-2.5-flash';
export const quotaExhaustedMessage =
  'HookLab is at its AI usage limit right now. Please try again in a few minutes.';
// A full reply takes ~10s; a stream silent for 8s has stalled and is retried.
const geminiTimeoutMs = 25_000;
const geminiStreamIdleMs = 8_000;
const oneHourMs = 60 * 60 * 1000;
const generateRateLimits = new Map<string, RateLimitBucket>();
const rewriteRateLimits = new Map<string, RateLimitBucket>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPlatform = (value: unknown): value is Platform =>
  typeof value === 'string' && platforms.includes(value as Platform);

const isTone = (value: unknown): value is Tone =>
  typeof value === 'string' && tones.includes(value as Tone);

const isAudience = (value: unknown): value is Audience =>
  typeof value === 'string' && audiences.includes(value as Audience);

const isIntensity = (value: unknown): value is Intensity =>
  typeof value === 'string' && intensities.includes(value as Intensity);

const isLanguage = (value: unknown): value is HookLanguage =>
  typeof value === 'string' && languages.includes(value as HookLanguage);

const isHookWindow = (value: unknown): value is HookWindow =>
  typeof value === 'number' && hookWindows.includes(value as HookWindow);

const isMode = (value: unknown): value is Mode =>
  typeof value === 'string' && modes.includes(value as Mode);

const isHookFramework = (value: unknown): value is HookFramework =>
  typeof value === 'string' && hookFrameworks.includes(value as HookFramework);

const isRewriteDirection = (value: unknown): value is RewriteDirection =>
  typeof value === 'string' &&
  rewriteDirections.includes(value as RewriteDirection);

const stripJsonFences = (text: string): string => {
  let cleaned = text
    .trim()
    .replace(/^[\s\S]*?```(?:json)?\s*/i, '')
    .replace(/\s*```[\s\S]*$/i, '');

  const firstBrace = cleaned.indexOf('{');
  if (firstBrace > 0) {
    cleaned = cleaned.slice(firstBrace);
  }

  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace !== -1 && lastBrace < cleaned.length - 1) {
    cleaned = cleaned.slice(0, lastBrace + 1);
  }

  return cleaned.trim();
};

export const extractJSON = stripJsonFences;

const normalizeScore = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

// Overlay fields are optional: a hook stays usable if the model omits them.
const optionalText = (value: unknown, maxLength: number): string | undefined =>
  typeof value === 'string' && value.trim().length > 0
    ? value.trim().slice(0, maxLength)
    : undefined;

const parseScores = (value: unknown): HookScores | null => {
  if (!isRecord(value)) {
    return null;
  }

  const curiosity = normalizeScore(value.curiosity);
  const clarity = normalizeScore(value.clarity);
  const scrollStop = normalizeScore(value.scroll_stop);
  const platformFit = normalizeScore(value.platform_fit);

  if (
    curiosity === null ||
    clarity === null ||
    scrollStop === null ||
    platformFit === null
  ) {
    return null;
  }

  return {
    curiosity,
    clarity,
    scroll_stop: scrollStop,
    platform_fit: platformFit,
  };
};

const parseHookItem = (
  item: unknown,
  expectedTimecode: HookTimecode,
): HookResult | null => {
  if (!isRecord(item)) return null;

  const scores = parseScores(item.scores);

  if (
    !isHookFramework(item.framework) ||
    typeof item.text !== 'string' ||
    item.text.trim().length === 0 ||
    typeof item.why !== 'string' ||
    item.why.trim().length === 0 ||
    scores === null
  ) {
    return null;
  }

  return {
    framework: item.framework,
    text: item.text.trim(),
    why: item.why.trim(),
    // The window is fixed by the request, so the model never needs to echo it.
    timecode: expectedTimecode,
    scores,
    best_pick: item.best_pick === true,
    on_screen_text: optionalText(item.on_screen_text, 80),
    visual: optionalText(item.visual, 200),
  };
};

const averageScore = (hook: HookResult): number =>
  (hook.scores.curiosity +
    hook.scores.clarity +
    hook.scores.scroll_stop +
    hook.scores.platform_fit) /
  4;

// A missing or duplicated best pick is repaired here instead of costing a retry.
const normalizeBestPick = (hooks: HookResult[]): HookResult[] => {
  if (hooks.filter((hook) => hook.best_pick).length === 1) return hooks;

  const best = hooks.reduce((top, hook) =>
    averageScore(hook) > averageScore(top) ? hook : top,
  );
  return hooks.map((hook) => ({ ...hook, best_pick: hook === best }));
};

const parseHooksPayload = (
  rawText: string,
  expectedTimecode: HookTimecode,
): { hooks: HookResult[] } | null => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(stripJsonFences(rawText));
  } catch {
    console.error('[HookLab] parseHooksPayload JSON parse failed.');
    return null;
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.hooks)) {
    console.error(
      '[HookLab] parseHooksPayload invalid structure, expected object with hooks array.',
    );
    return null;
  }

  const hooks: HookResult[] = [];

  for (const item of parsed.hooks) {
    const hook = parseHookItem(item, expectedTimecode);

    if (!hook) {
      console.error('[HookLab] Invalid hook item.');
      return null;
    }
    if (hooks.some((seen) => seen.framework === hook.framework)) {
      console.error(`[HookLab] Duplicate framework: ${hook.framework}`);
      return null;
    }

    hooks.push(hook);
  }

  if (
    hooks.length !== hookFrameworks.length ||
    !hookFrameworks.every((framework) =>
      hooks.some((hook) => hook.framework === framework),
    )
  ) {
    return null;
  }

  return { hooks: normalizeBestPick(hooks) };
};

/**
 * Pulls every complete object out of the "hooks" array of a partial JSON
 * stream, so finished hooks can be shown while the rest are still generating.
 */
export const extractStreamedHooks = (
  partialText: string,
  expectedTimecode: HookTimecode,
): HookResult[] => {
  const keyIndex = partialText.indexOf('"hooks"');
  if (keyIndex === -1) return [];
  const arrayStart = partialText.indexOf('[', keyIndex);
  if (arrayStart === -1) return [];

  const hooks: HookResult[] = [];
  let depth = 0;
  let objectStart = -1;
  let inString = false;
  let escaped = false;

  for (let index = arrayStart + 1; index < partialText.length; index += 1) {
    const character = partialText[index];

    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') inString = true;
    else if (character === '{') {
      if (depth === 0) objectStart = index;
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0 && objectStart !== -1) {
        try {
          const hook = parseHookItem(
            JSON.parse(partialText.slice(objectStart, index + 1)),
            expectedTimecode,
          );
          if (hook) hooks.push(hook);
        } catch {
          /* An unparseable object is skipped; the final validation decides. */
        }
        objectStart = -1;
      }
    } else if (character === ']' && depth === 0) {
      break;
    }
  }

  return hooks;
};

const parseRoastCritique = (value: unknown): RoastCritique | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.grade !== 'string' ||
    value.grade.trim().length === 0 ||
    !Array.isArray(value.bullets) ||
    value.bullets.length < 4 ||
    value.bullets.length > 6 ||
    !value.bullets.every(
      (bullet: unknown) =>
        typeof bullet === 'string' && bullet.trim().length > 0,
    ) ||
    typeof value.biggest_fix !== 'string' ||
    value.biggest_fix.trim().length === 0
  ) {
    return null;
  }

  return {
    grade: value.grade.trim(),
    bullets: value.bullets.map((bullet: string) => bullet.trim()),
    biggest_fix: value.biggest_fix.trim(),
  };
};

const parseRoastPayload = (
  rawText: string,
  expectedTimecode: HookTimecode,
): { hooks: HookResult[]; roast: RoastCritique } | null => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(stripJsonFences(rawText));
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  const roast = parseRoastCritique(parsed.roast);

  if (!roast) {
    return null;
  }

  if (!Array.isArray(parsed.hooks)) {
    return null;
  }

  const hooksResponse = parseHooksPayload(
    JSON.stringify({ hooks: parsed.hooks }),
    expectedTimecode,
  );

  if (!hooksResponse) {
    return null;
  }

  return { hooks: hooksResponse.hooks, roast };
};

const parseRewritePayload = (rawText: string): RewriteHookResponse | null => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(stripJsonFences(rawText));
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  const scores = parseScores(parsed.scores);

  if (
    typeof parsed.text !== 'string' ||
    parsed.text.trim().length === 0 ||
    typeof parsed.why !== 'string' ||
    parsed.why.trim().length === 0 ||
    scores === null
  ) {
    return null;
  }

  return {
    text: parsed.text.trim(),
    why: parsed.why.trim(),
    scores,
    on_screen_text: optionalText(parsed.on_screen_text, 80),
    visual: optionalText(parsed.visual, 200),
  };
};

const parseCompareAnalysis = (value: unknown): CompareAnalysis | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    (value.winner === 'A' || value.winner === 'B') &&
    typeof value.reason === 'string' &&
    value.reason.trim().length > 0
  ) {
    return {
      winner: value.winner,
      reason: value.reason.trim(),
    };
  }

  return null;
};

const parseComparePayload = (rawText: string): CompareHooksResponse | null => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(stripJsonFences(rawText));
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  if (parsed.winner !== 'A' && parsed.winner !== 'B') {
    return null;
  }

  if (
    typeof parsed.confidence !== 'number' ||
    typeof parsed.summary !== 'string' ||
    typeof parsed.improvedHook !== 'string' ||
    !isRecord(parsed.analysis)
  ) {
    return null;
  }

  const clarity = parseCompareAnalysis(parsed.analysis.clarity);
  const curiosity = parseCompareAnalysis(parsed.analysis.curiosity);
  const emotion = parseCompareAnalysis(parsed.analysis.emotion);
  const retention = parseCompareAnalysis(parsed.analysis.retention);

  if (!clarity || !curiosity || !emotion || !retention) {
    return null;
  }

  return {
    winner: parsed.winner,
    confidence: Math.max(0, Math.min(100, Math.round(parsed.confidence))),
    summary: parsed.summary.trim(),
    improvedHook: parsed.improvedHook.trim(),
    analysis: {
      clarity,
      curiosity,
      emotion,
      retention,
    },
  };
};

export const maxNicheLength = 60;

// The niche is user text placed inside a prompt: keep it short and on one line.
export const normalizeNiche = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const cleaned = value
    .replace(/[\r\n\t"`]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxNicheLength);
  return cleaned.length > 0 ? cleaned : undefined;
};

const nicheLine = (request: GenerateHooksRequest): string =>
  request.niche
    ? `\nNICHE: "${request.niche}" — use the vocabulary and reference points this niche's viewers recognise. The SOURCE topic still wins if they differ.`
    : '';

const validateGenerateBody = (
  body: unknown,
): GenerateHooksRequest | { error: string } => {
  if (!isRecord(body)) {
    return { error: 'Invalid request body.' };
  }

  const script = body.script;
  const mode = isMode(body.mode) ? body.mode : 'generate';
  const minLength = mode === 'roast' ? 5 : 20;

  if (typeof script !== 'string') {
    return {
      error: `Script must be between ${minLength} and 3000 characters.`,
    };
  }

  const trimmedScript = script.trim();

  if (trimmedScript.length < minLength || trimmedScript.length > 3000) {
    return {
      error: `Script must be between ${minLength} and 3000 characters.`,
    };
  }

  let hookBData: string | undefined;

  if (mode === 'compare') {
    if (typeof body.hookB !== 'string') {
      return {
        error: 'Hook B is required for comparison.',
      };
    }
    const trimmedHookB = body.hookB.trim();
    if (trimmedHookB.length < minLength || trimmedHookB.length > 3000) {
      return {
        error: `Hook B must be between ${minLength} and 3000 characters.`,
      };
    }
    hookBData = trimmedHookB;
  }

  if (
    !isPlatform(body.platform) ||
    !isTone(body.tone) ||
    !isAudience(body.audience) ||
    !isIntensity(body.intensity) ||
    !isLanguage(body.language) ||
    !isHookWindow(body.hookWindow)
  ) {
    return { error: 'One or more controls are invalid.' };
  }

  if (body.niche !== undefined && typeof body.niche !== 'string') {
    return { error: 'One or more controls are invalid.' };
  }
  const niche = normalizeNiche(body.niche);

  return {
    script: trimmedScript,
    hookB: hookBData,
    ...(niche ? { niche } : {}),
    platform: body.platform,
    tone: body.tone,
    audience: body.audience,
    intensity: body.intensity,
    language: body.language,
    hookWindow: body.hookWindow,
    mode,
  };
};

const validateRewriteBody = (
  body: unknown,
): RewriteHookRequest | { error: string } => {
  if (!isRecord(body)) {
    return { error: 'Invalid request body.' };
  }

  if (
    typeof body.hook !== 'string' ||
    body.hook.trim().length === 0 ||
    body.hook.trim().length > 600
  ) {
    return { error: 'Hook is invalid.' };
  }

  if (
    !isHookFramework(body.framework) ||
    !isRewriteDirection(body.direction) ||
    !isPlatform(body.platform) ||
    !isHookWindow(body.hookWindow)
  ) {
    return { error: 'One or more controls are invalid.' };
  }

  return {
    hook: body.hook.trim(),
    framework: body.framework,
    direction: body.direction,
    platform: body.platform,
    hookWindow: body.hookWindow,
  };
};

const checkRateLimit = (
  buckets: Map<string, RateLimitBucket>,
  ip: string,
  maxRequests: number,
): boolean => {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + oneHourMs });
    return true;
  }

  if (bucket.count >= maxRequests) {
    return false;
  }

  bucket.count += 1;
  return true;
};

const platformDirections: Record<Platform, string> = {
  'YouTube Shorts':
    'Fast-paced, curiosity-driven, 15-60 seconds. Hook must work without sound. First frame matters most.',
  'Instagram Reels':
    "Emotion-first, identity-driven, 15-30 seconds. Viewer must feel seen or called out immediately. Use 'you' language.",
  TikTok:
    'Pattern interrupt heavy, 7-15 seconds ideal. Weird, specific, or controversial openings outperform polished ones. Raw beats produced.',
};

const toneDirections: Record<Tone, string> = {
  Punchy: 'Short sentences. High energy. No wasted words.',
  Clean: 'Clear, professional, trustworthy. No hype.',
  Controversial: 'Challenge a common belief. Start a debate.',
  Story: 'Pull them into a moment. Past tense. Specific detail.',
};

const audienceDirections: Record<Audience, string> = {
  Beginners: 'Instantly understandable. No jargon.',
  Creators: 'Speak to creators and video editors.',
  Business: 'Focus on revenue, systems, or leverage.',
  Fitness: 'Focus on visible progress or discipline.',
  Finance: 'Focus on money behavior and outcomes.',
};

const intensityDirections: Record<Intensity, string> = {
  Safe: 'Direct and confident but kind.',
  Sharp: 'Blunt. No softening.',
  Aggressive: 'No mercy. Maximum tension. Push every boundary.',
};

const languageDirections: Record<HookLanguage, string> = {
  English: 'Write in fluent English.',
  Hinglish:
    'Write in natural Hinglish — the way Indian creators actually speak on YouTube and Instagram. Mix Hindi and English naturally. NOT translated Hindi. Real internet Hinglish.',
  Hindi: 'Write entirely in Hindi using Devanagari script. Proper grammar.',
};

const overlayRules = `- "on_screen_text" is the caption overlay for the first frame: at most 8 words, readable with sound off, complementing (not repeating word for word) the spoken hook. Use the same language as the hook.
- "visual" is one short sentence describing what the viewer sees in the first second. It must be filmable by a solo creator with a phone and match the source topic.`;

const buildGenerateSystemPrompt = (request: GenerateHooksRequest): string =>
  `
You are an expert video hook writer who has studied 10,000 viral videos.
Your job is to rewrite the user's SOURCE SCRIPT opening hook in 10 different frameworks.

CRITICAL SOURCE-GROUNDING RULE:
You are rewriting the user's SOURCE SCRIPT. The SOURCE SCRIPT is the only source of truth.
Every hook must preserve the script's exact topic, niche, facts, intent, and core claim.
Never switch to generic creator advice, social media advice, editing advice, or another niche unless that is explicitly what the SOURCE SCRIPT is about.
Do not invent new subject matter, fake statistics, fake outcomes, or unrelated examples.
Do not write hooks about Reels, TikTok, creators, posting, views, editing, or content unless those ideas appear in the SOURCE SCRIPT.

PLATFORM: ${request.platform}
Platform rules: ${platformDirections[request.platform] ?? 'Short-form video. Hook must stop the scroll instantly.'}

TONE: ${request.tone} — ${toneDirections[request.tone] ?? 'Engaging and clear.'}
AUDIENCE: ${request.audience} — ${audienceDirections[request.audience]}${nicheLine(request)}
INTENSITY: ${request.intensity} — ${intensityDirections[request.intensity] ?? 'Confident and direct.'}
LANGUAGE: ${languageDirections[request.language] ?? 'Write in English.'}

YOUR TASK:
Rewrite the given script's opening hook in 10 different frameworks.
Source-topic anchors to preserve where natural: ${extractTopicAnchors(request.script).join(', ')}

FRAMEWORKS TO USE (exactly these, in this order):
${hookFrameworks.map((fw, i) => `${i + 1}. ${fw}`).join('\n')}

CRITICAL RULES:
- Return ONLY valid JSON. No text before or after. No markdown. No explanation.
- Do not write \`\`\`json or any code fences.
- Start your response with { and end with }
- Every hook must be platform-appropriate for ${request.platform}
- Set exactly one item to "best_pick": true. Pick the strongest default choice for ${request.platform}.
- Keep every hook short enough to say inside ${request.hookWindow} seconds.
- Every hook should include at least one concrete source-specific noun, entity, or fact when natural.
- "why" is one short sentence (at most 15 words) naming the attention mechanism. Specific to this hook, not generic praise.
- Scores must be integers from 0 to 100.
- Score curiosity by unanswered tension, clarity by instant understanding, scroll_stop by pause power, and platform_fit by pacing match.
- Do not include quotation marks around the spoken hook unless the line itself needs them.
${overlayRules}

REQUIRED JSON SHAPE:
{
  "hooks": [
    {
      "framework": "CURIOSITY GAP",
      "text": "the rewritten hook here",
      "why": "why this works for this specific script and platform",
      "scores": {
        "curiosity": 85,
        "clarity": 78,
        "scroll_stop": 91,
        "platform_fit": 88
      },
      "best_pick": false,
      "on_screen_text": "short caption overlay",
      "visual": "what the first frame shows"
    }
  ]
}
`.trim();

const buildGenerateUserPrompt = (
  request: GenerateHooksRequest,
  retry = false,
): string =>
  `
${retry ? 'The previous output drifted off-topic and was rejected. Regenerate from the source only.' : ''}
SOURCE SCRIPT:
"""
${request.script}
"""

Task:
Rewrite the opening ${request.hookWindow} seconds of this exact SOURCE SCRIPT into the 10 required hook frameworks.
Preserve the same topic and facts. Do not change the niche.
`.trim();

const buildRewriteSystemPrompt = (request: RewriteHookRequest): string =>
  `
You are HookLab.AI, a senior short-form video editor and retention strategist.
Rewrite one existing ${request.framework} hook for ${request.platform}.

Direction: ${request.direction}
Hook window: ${request.hookWindow} seconds
Platform direction: ${platformDirections[request.platform]}

Return strict JSON only. No markdown fences, no preamble, no commentary.
Return exactly this shape:
{
  "text": "...",
  "why": "...",
  "scores": {
    "curiosity": 84,
    "clarity": 90,
    "scroll_stop": 79,
    "platform_fit": 88
  },
  "on_screen_text": "...",
  "visual": "..."
}

Rules:
- Preserve the original hook's language and audience cues.
- Keep the hook short enough to say inside ${request.hookWindow} seconds.
- Apply the direction clearly without changing the framework.
${overlayRules}
- "why" is one short sentence (at most 15 words) naming the attention mechanism.
- Scores must be integers from 0 to 100.
`.trim();

const buildRoastSystemPrompt = (request: GenerateHooksRequest): string =>
  `
You are HookLab.AI, a senior short-form video editor and retention strategist.
You are in ROAST mode. The user has pasted an existing hook that they want critiqued.

First, produce a brutally honest but constructive critique of their hook.
Be specific about what fails and why. Do not be vague or generic.
Grade on an A+ to F scale. Be honest — most hooks deserve a C or lower.

Then generate 10 improved hook alternatives using the standard frameworks.

CRITICAL SOURCE-GROUNDING RULE:
The user's EXISTING HOOK is the source of truth for the topic.
Every generated alternative must preserve the hook's exact topic, niche, facts, intent, and core claim.
Do not switch to generic creator advice, social media advice, editing advice, or another niche.
Do not invent new subject matter, fake statistics, fake outcomes, or unrelated examples.
Do not add numbers, percentages, time spans, certifications, rankings, or measurable claims that are not in the EXISTING HOOK.
Do not write hooks about Reels, TikTok, creators, posting, views, editing, or content unless those ideas appear in the EXISTING HOOK.

Platform: ${request.platform}
Tone: ${request.tone}
Audience: ${request.audience}
Intensity: ${request.intensity}
Language: ${request.language}
Hook window: ${request.hookWindow} seconds

Platform direction: ${platformDirections[request.platform]}
Tone direction: ${toneDirections[request.tone]}
Audience direction: ${audienceDirections[request.audience]}${nicheLine(request)}
Intensity direction: ${intensityDirections[request.intensity]}
Language direction: ${languageDirections[request.language]}

Return strict JSON only. No markdown fences, no preamble, no commentary.
Return exactly this shape:
{
  "roast": {
    "grade": "C-",
    "bullets": [
      "Opens with 'I' — the viewer does not care about you yet.",
      "No curiosity gap. Nothing makes the viewer need to keep watching.",
      "The benefit arrives too late.",
      "Feels like a diary entry instead of a hook."
    ],
    "biggest_fix": "Lead with the outcome or tension, not yourself."
  },
  "hooks": [
    {
      "framework": "CURIOSITY GAP",
      "text": "...",
      "why": "...",
      "scores": {
        "curiosity": 88,
        "clarity": 72,
        "scroll_stop": 91,
        "platform_fit": 85
      },
      "best_pick": false,
      "on_screen_text": "short caption overlay",
      "visual": "what the first frame shows"
    }
  ]
}

Roast rules:
- "bullets" must have 4 to 6 items.
- Each bullet must be a specific, actionable critique of the EXISTING HOOK.
- Do not use generic phrases like "could be better" or "needs improvement".
- "biggest_fix" must be one clear sentence describing the single most impactful change.
- "grade" must be a single letter grade (A+ through F).

Hooks rules:
- Return exactly 10 items.
- Use each framework exactly once: ${hookFrameworks.join(', ')}.
- Set exactly one item to "best_pick": true. Pick the strongest default choice for ${request.platform}.
- Keep every hook short enough to say inside ${request.hookWindow} seconds.
- Every hook must clearly be a rewrite of the EXISTING HOOK, not a generic hook template.
- Every hook should include at least one concrete source-specific noun, entity, or fact when natural.
- Do not add unsupported numeric claims. Reuse only numbers/facts already present in the EXISTING HOOK.
- "why" is one short sentence (at most 15 words) naming the attention mechanism, not generic praise.
- Scores must be integers from 0 to 100.
- Score curiosity by unanswered tension, clarity by instant understanding, scroll_stop by pause power, and platform_fit by pacing match.
- Do not include quotation marks around the spoken hook unless the line itself needs them.
${overlayRules}
`.trim();

const buildRoastUserPrompt = (
  request: GenerateHooksRequest,
  retry = false,
): string =>
  `
${retry ? 'The previous output drifted off-topic and was rejected. Regenerate from the source only.' : ''}
EXISTING HOOK:
"""
${request.script}
"""

Task:
1. Roast this hook honestly. Be specific about what fails.
2. Then rewrite it into the 10 required hook frameworks for ${request.platform}.
Preserve the same topic and facts. Do not change the niche.
`.trim();

const buildCompareSystemPrompt = (request: GenerateHooksRequest): string =>
  `
You are HookLab.AI, a senior short-form video editor and retention strategist.
You are in COMPARE mode. The user has provided two hooks: Hook A and Hook B.
Your job is to objectively analyze them and declare a winner.

Judge like an experienced short-form content strategist.
Prioritize:
- Curiosity gap
- Retention mechanics
- Specificity
- Emotional pull
- Stopping power
Avoid generic motivational advice.

CRITICAL RULES:
1. You MUST pick a winner ("A" or "B"). Do not hedge. Do not say "both are good". If confidence is low, still pick one and explain why.
2. The "improvedHook" MUST be an original, superior hook that combines the best parts of both or uses a stronger framework. It must preserve the exact topic and facts.

Platform: ${request.platform}
Tone: ${request.tone}
Audience: ${request.audience}${nicheLine(request)}
Intensity: ${request.intensity}
Language: ${request.language}

Return strict JSON only. No markdown fences, no preamble, no commentary.
Return exactly this shape:
{
  "winner": "A",
  "confidence": 92,
  "summary": "Hook A creates a stronger curiosity gap and avoids the slow setup found in Hook B.",
  "analysis": {
    "clarity": {
      "winner": "A",
      "reason": "Gets to the point immediately without unnecessary filler."
    },
    "curiosity": {
      "winner": "B",
      "reason": "Teases the outcome slightly better by withholding the specific tool name."
    },
    "emotion": {
      "winner": "A",
      "reason": "Uses stronger stakes that resonate directly with the target audience."
    },
    "retention": {
      "winner": "A",
      "reason": "The pacing naturally forces the viewer to wait for the resolution."
    }
  },
  "improvedHook": "..."
}
`.trim();

const buildCompareUserPrompt = (
  request: GenerateHooksRequest,
  retry = false,
): string =>
  `
${retry ? 'The previous output drifted off-topic and was rejected. Regenerate from the source only.' : ''}
HOOK A:
"""
${request.script}
"""

HOOK B:
"""
${request.hookB}
"""

Task:
Compare Hook A and Hook B. Pick a clear winner, analyze the four metrics, and provide one ultimately improved hook.
`.trim();

const extractGeminiText = (
  payload: GeminiGenerateContentResponse,
): string | null => {
  const text =
    payload.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text?.trim() ?? '')
      .join('\n')
      .trim() ?? '';

  return text.length > 0 ? text : null;
};

// Streamed chunks split mid-word, so they must be joined exactly as sent.
const extractGeminiChunk = (payload: GeminiGenerateContentResponse): string =>
  payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('') ?? '';

export class GeminiApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GeminiApiError';
  }
}

export interface GeminiCallOptions {
  /** Gemini response schema; enforces the JSON shape so fewer replies need a retry. */
  schema?: GeminiSchema;
  /** When set, the reply is streamed and called with the accumulated text. */
  onText?: (accumulatedText: string) => void;
}

const readGeminiError = async (response: Response): Promise<never> => {
  const body = await response.text();
  let errMsg = 'Gemini API error';
  try {
    const errPayload = JSON.parse(body) as Record<string, unknown>;
    if (
      errPayload &&
      typeof errPayload.error === 'object' &&
      errPayload.error !== null &&
      typeof (errPayload.error as Record<string, unknown>).message === 'string'
    ) {
      errMsg = (errPayload.error as Record<string, unknown>).message as string;
    }
  } catch {
    // ignore
  }
  console.error(`[HookLab] Gemini error status: ${response.status}`);
  throw new GeminiApiError(response.status, errMsg);
};

// Accumulates the text parts of a server-sent-event stream from Gemini.
const readGeminiStream = async (
  response: Response,
  onText: (accumulatedText: string) => void,
  onActivity: () => void,
): Promise<string | null> => {
  if (!response.body) return null;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';

  for (;;) {
    const { done, value } = await reader.read();
    onActivity();
    buffer += decoder.decode(value, { stream: !done });

    const events = buffer.split(/\r?\n\r?\n/);
    buffer = done ? '' : (events.pop() ?? '');

    for (const event of events) {
      const data = event
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('');
      if (!data) continue;
      try {
        const chunk = extractGeminiChunk(
          JSON.parse(data) as GeminiGenerateContentResponse,
        );
        if (chunk) {
          text += chunk;
          onText(text);
        }
      } catch {
        /* Ignore keep-alive or malformed events; final parsing validates. */
      }
    }

    if (done) break;
  }

  return text.trim() || null;
};

const callGemini = async (
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  options: GeminiCallOptions = {},
): Promise<string | null> => {
  const start = Date.now();
  const method = options.onText
    ? 'streamGenerateContent?alt=sse&'
    : 'generateContent?';
  const controller = new AbortController();
  const timeout = (): void =>
    controller.abort(new DOMException('Gemini timed out', 'TimeoutError'));
  const totalTimer = setTimeout(timeout, geminiTimeoutMs);
  // Only streams get an idle limit; a plain reply is silent until it is done.
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const resetIdle = (): void => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(timeout, geminiStreamIdleMs);
  };
  if (options.onText) resetIdle();
  let response: Response;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${method}key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            // Headroom for Devanagari output, which uses more tokens per word.
            maxOutputTokens: 4096,
            temperature: 0.7,
            responseMimeType: 'application/json',
            ...(options.schema ? { responseSchema: options.schema } : {}),
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
      },
    );

    if (!response.ok) {
      return await readGeminiError(response);
    }

    const text = options.onText
      ? await readGeminiStream(response, options.onText, resetIdle)
      : extractGeminiText(
          (await response.json()) as GeminiGenerateContentResponse,
        );
    console.info(`[HookLab] Gemini response parsed in ${Date.now() - start}ms`);
    if (!text) {
      console.warn('[HookLab] Gemini returned 200 but no text was extracted.');
    }
    return text;
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')
    ) {
      console.error('[HookLab] Gemini call timed out.');
      throw new GeminiApiError(
        504,
        'The AI took too long to respond. Please try again.',
      );
    }
    throw error;
  } finally {
    clearTimeout(totalTimer);
    clearTimeout(idleTimer);
  }
};

export class AllKeysExhaustedError extends Error {
  constructor() {
    super('All API keys exhausted');
    this.name = 'AllKeysExhaustedError';
  }
}

export const callGeminiWithRotation = async (
  apiKeys: string[],
  model: string,
  systemPrompt: string,
  userPrompt: string,
  options: GeminiCallOptions = {},
): Promise<string | null> => {
  let lastError: GeminiApiError | null = null;

  console.info(
    `[HookLab] Starting Gemini call. Keys available: ${apiKeys.length}`,
  );
  console.info(`[HookLab] Model: ${model}`);

  for (let i = 0; i < apiKeys.length; i += 1) {
    const key = apiKeys[i];
    const start = Date.now();
    console.info(`[HookLab] Trying key ${i + 1}/${apiKeys.length}`);

    try {
      const text = await callGemini(
        key,
        model,
        systemPrompt,
        userPrompt,
        options,
      );
      console.info(
        `[HookLab] Key ${i + 1} succeeded in ${Date.now() - start}ms`,
      );
      return text;
    } catch (err) {
      if (err instanceof GeminiApiError && err.status === 429) {
        lastError = err;
        console.warn(`[HookLab] 429 on key ${i + 1}. Rotating...`);
        // Key exhausted, try the next one
        continue;
      }
      if (err instanceof GeminiApiError) {
        console.error(`[HookLab] Non-429 error on key ${i + 1}: ${err.status}`);
      } else {
        console.error(
          `[HookLab] Unexpected Gemini call failure on key ${i + 1}`,
        );
      }
      // Non-429 errors should propagate immediately
      throw err;
    }
  }

  // All keys returned 429
  if (lastError) {
    console.error(
      `[HookLab] ALL ${apiKeys.length} keys exhausted. Returning friendly error.`,
    );
    throw new AllKeysExhaustedError();
  }

  console.warn('[HookLab] Gemini rotation finished without a result or error.');
  return null;
};

export const createGenerateHooksResponse = async ({
  apiKeys,
  body,
  ip = 'unknown',
  model = defaultGeminiModel,
  onEvent,
}: GenerateHooksHandlerOptions): Promise<
  HandlerResult<GenerateHooksResponse>
> => {
  const request = validateGenerateBody(body);

  if ('error' in request) {
    console.warn(`[HookLab] Invalid generate request: ${request.error}`);
    return { status: 400, payload: { error: request.error } };
  }

  console.info(
    `[HookLab] Generate request accepted. mode=${request.mode}, platform=${request.platform}`,
  );

  if (!checkRateLimit(generateRateLimits, ip, 10)) {
    console.warn('[HookLab] Generate rate limit exceeded.');
    return {
      status: 429,
      payload: { error: 'Too many requests. Try again in a bit.' },
    };
  }

  if (apiKeys.length === 0) {
    console.error('[HookLab] Generate failed before Gemini call: no API keys.');
    return {
      status: 500,
      payload: { error: 'Server is missing the Gemini API key.' },
    };
  }

  // Streams each finished hook to the client; a retry clears what was shown.
  const streamingOptions = (
    schema: GeminiSchema,
    attempt: number,
  ): GeminiCallOptions => {
    if (!onEvent) return { schema };
    if (attempt > 0) onEvent({ type: 'reset' });

    let sent = 0;
    const timecode = hookWindowTimecodes[request.hookWindow];
    return {
      schema,
      onText: (accumulatedText) => {
        const streamed = extractStreamedHooks(accumulatedText, timecode);
        for (; sent < streamed.length; sent += 1) {
          onEvent({ type: 'hook', hook: streamed[sent] });
        }
      },
    };
  };

  try {
    let generatedHooks: GenerateHooksResponse | null = null;
    let geminiError: { status: number; message: string } | null = null;

    if (request.mode === 'compare') {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const text = await callGeminiWithRotation(
            apiKeys,
            model,
            buildCompareSystemPrompt(request),
            buildCompareUserPrompt(request, attempt > 0),
            { schema: compareSchema },
          );
          const parsedCompare = text ? parseComparePayload(text) : null;

          if (parsedCompare) {
            generatedHooks = { mode: 'compare', compare: parsedCompare };
            break;
          }
          console.warn(
            `[HookLab] Compare payload parse failed on attempt ${attempt + 1}.`,
          );
        } catch (err) {
          if (err instanceof AllKeysExhaustedError) {
            return {
              status: 429,
              payload: {
                error: quotaExhaustedMessage,
              },
            };
          }
          if (err instanceof GeminiApiError) {
            geminiError = { status: err.status, message: err.message };
          } else {
            throw err;
          }
        }
      }
    } else if (request.mode === 'roast') {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const text = await callGeminiWithRotation(
            apiKeys,
            model,
            buildRoastSystemPrompt(request),
            buildRoastUserPrompt(request, attempt > 0),
            streamingOptions(roastSchema, attempt),
          );
          const parsedRoast = text
            ? parseRoastPayload(text, hookWindowTimecodes[request.hookWindow])
            : null;

          if (
            parsedRoast &&
            isGenerationGrounded(request, {
              mode: 'roast',
              hooks: parsedRoast.hooks,
              roast: parsedRoast.roast,
            })
          ) {
            generatedHooks = {
              mode: 'roast',
              hooks: parsedRoast.hooks,
              roast: parsedRoast.roast,
            };
            break;
          }
          console.warn(
            `[HookLab] Roast payload parse/grounding failed on attempt ${attempt + 1}.`,
          );
        } catch (err) {
          if (err instanceof AllKeysExhaustedError) {
            return {
              status: 429,
              payload: {
                error: quotaExhaustedMessage,
              },
            };
          }
          if (err instanceof GeminiApiError) {
            geminiError = { status: err.status, message: err.message };
          } else {
            throw err;
          }
        }
      }
    } else {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const text = await callGeminiWithRotation(
            apiKeys,
            model,
            buildGenerateSystemPrompt(request),
            buildGenerateUserPrompt(request, attempt > 0),
            streamingOptions(hooksSchema, attempt),
          );
          const parsedHooks = text
            ? parseHooksPayload(text, hookWindowTimecodes[request.hookWindow])
            : null;

          if (
            parsedHooks &&
            isGenerationGrounded(request, {
              mode: 'generate',
              hooks: parsedHooks.hooks,
            })
          ) {
            generatedHooks = { mode: 'generate', hooks: parsedHooks.hooks };
            break;
          }
          console.warn(
            `[HookLab] Generate payload parse/grounding failed on attempt ${attempt + 1}.`,
          );
        } catch (err) {
          if (err instanceof AllKeysExhaustedError) {
            return {
              status: 429,
              payload: {
                error: quotaExhaustedMessage,
              },
            };
          }
          if (err instanceof GeminiApiError) {
            geminiError = { status: err.status, message: err.message };
          } else {
            throw err;
          }
        }
      }
    }

    if (!generatedHooks) {
      if (geminiError) {
        console.error(
          `[HookLab] Returning Gemini error to client. status=${geminiError.status}`,
        );
        return {
          status: geminiError.status === 400 ? 400 : 502,
          payload: {
            error:
              geminiError.message ||
              'Something went wrong on our end. Try again.',
          },
        };
      }
      console.error(
        '[HookLab] Returning generic 502: Gemini response could not be parsed or grounded.',
      );
      return {
        status: 502,
        payload: { error: 'Something went wrong on our end. Try again.' },
      };
    }

    return { status: 200, payload: generatedHooks };
  } catch {
    console.error('[HookLab] Unhandled generate failure.');
    return {
      status: 502,
      payload: { error: 'Something went wrong on our end. Try again.' },
    };
  }
};

export const createRewriteHookResponse = async ({
  apiKeys,
  body,
  ip = 'unknown',
  model = defaultGeminiModel,
}: RewriteHookHandlerOptions): Promise<HandlerResult<RewriteHookResponse>> => {
  const request = validateRewriteBody(body);

  if ('error' in request) {
    console.warn(`[HookLab] Invalid rewrite request: ${request.error}`);
    return { status: 400, payload: { error: request.error } };
  }

  console.info(
    `[HookLab] Rewrite request accepted. direction=${request.direction}`,
  );

  if (!checkRateLimit(rewriteRateLimits, ip, 20)) {
    console.warn('[HookLab] Rewrite rate limit exceeded.');
    return {
      status: 429,
      payload: { error: 'Too many requests. Try again in a bit.' },
    };
  }

  if (apiKeys.length === 0) {
    console.error('[HookLab] Rewrite failed before Gemini call: no API keys.');
    return {
      status: 500,
      payload: { error: 'Server is missing the Gemini API key.' },
    };
  }

  try {
    const text = await callGeminiWithRotation(
      apiKeys,
      model,
      buildRewriteSystemPrompt(request),
      request.hook,
      { schema: rewriteSchema },
    );
    const rewrittenHook = text ? parseRewritePayload(text) : null;

    if (!rewrittenHook) {
      console.error('[HookLab] Rewrite payload parse failed.');
      return {
        status: 502,
        payload: { error: 'Something went wrong on our end. Try again.' },
      };
    }

    return { status: 200, payload: rewrittenHook };
  } catch (err) {
    if (err instanceof AllKeysExhaustedError) {
      return {
        status: 429,
        payload: {
          error: quotaExhaustedMessage,
        },
      };
    }
    if (err instanceof GeminiApiError) {
      console.error(
        `[HookLab] Returning rewrite Gemini error to client. status=${err.status}`,
      );
      return {
        status: err.status === 400 ? 400 : 502,
        payload: {
          error: err.message || 'Something went wrong on our end. Try again.',
        },
      };
    }
    console.error('[HookLab] Unhandled rewrite failure.');
    return {
      status: 502,
      payload: { error: 'Something went wrong on our end. Try again.' },
    };
  }
};
