import {
  audiences,
  platforms,
  tones,
  type Audience,
  type ExpandHookRequest,
  type ExpandHookResponse,
  type Platform,
  type Tone,
} from '../types/hooks.js';
import {
  AllKeysExhaustedError,
  callGeminiWithRotation,
  defaultGeminiModel,
  extractJSON,
  GeminiApiError,
  type HandlerResult,
} from './hookGeneration.js';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface ExpandHookHandlerOptions {
  apiKeys: string[];
  body: unknown;
  ip?: string;
  model?: string;
}

const oneHourMs = 60 * 60 * 1000;
const expandRateLimits = new Map<string, RateLimitBucket>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPlatform = (value: unknown): value is Platform =>
  typeof value === 'string' && platforms.includes(value as Platform);

const isTone = (value: unknown): value is Tone =>
  typeof value === 'string' && tones.includes(value as Tone);

const isAudience = (value: unknown): value is Audience =>
  typeof value === 'string' && audiences.includes(value as Audience);

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

const validateExpandBody = (
  body: unknown,
): ExpandHookRequest | { error: string } => {
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
    typeof body.framework !== 'string' ||
    body.framework.trim().length === 0 ||
    body.framework.trim().length > 80
  ) {
    return { error: 'Framework is invalid.' };
  }

  if (
    typeof body.originalScript !== 'string' ||
    body.originalScript.trim().length < 5 ||
    body.originalScript.trim().length > 3000
  ) {
    return { error: 'Original script is invalid.' };
  }

  if (
    !isPlatform(body.platform) ||
    !isTone(body.tone) ||
    !isAudience(body.audience)
  ) {
    return { error: 'One or more controls are invalid.' };
  }

  return {
    hook: body.hook.trim(),
    framework: body.framework.trim(),
    platform: body.platform,
    originalScript: body.originalScript.trim(),
    tone: body.tone,
    audience: body.audience,
  };
};

const parseExpansionPayload = (rawText: string): ExpandHookResponse | null => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJSON(rawText));
  } catch {
    return null;
  }

  if (!isRecord(parsed) || !isRecord(parsed.outline)) {
    return null;
  }

  const outline = parsed.outline;

  if (
    typeof outline.hook_recap !== 'string' ||
    outline.hook_recap.trim().length === 0 ||
    !Array.isArray(outline.beats) ||
    outline.beats.length < 4 ||
    outline.beats.length > 6 ||
    typeof outline.cta_suggestion !== 'string' ||
    outline.cta_suggestion.trim().length === 0
  ) {
    return null;
  }

  const beats = outline.beats.map((beat: unknown) => {
    if (
      !isRecord(beat) ||
      typeof beat.label !== 'string' ||
      beat.label.trim().length === 0 ||
      typeof beat.duration_hint !== 'string' ||
      beat.duration_hint.trim().length === 0 ||
      typeof beat.description !== 'string' ||
      beat.description.trim().length === 0
    ) {
      return null;
    }

    return {
      label: beat.label.trim(),
      duration_hint: beat.duration_hint.trim(),
      description: beat.description.trim(),
    };
  });

  if (beats.some((beat) => beat === null)) {
    return null;
  }

  return {
    outline: {
      hook_recap: outline.hook_recap.trim(),
      beats: beats as ExpandHookResponse['outline']['beats'],
      cta_suggestion: outline.cta_suggestion.trim(),
    },
  };
};

const buildExpansionSystemPrompt = (request: ExpandHookRequest): string =>
  `
You are a video structure expert. A creator has chosen their opening hook.
Your job is to outline the REST of the video — not write a full script,
an outline a creator can use to structure their own words around.

Return ONLY valid JSON. No markdown fences. No preamble.

{
  "outline": {
    "hook_recap": "the hook they're using, verbatim",
    "beats": [
      {
        "label": "SETUP",
        "duration_hint": "0:05-0:15",
        "description": "1-2 sentences on what happens in this beat"
      },
      { "label": "...", "duration_hint": "...", "description": "..." }
    ],
    "cta_suggestion": "one sentence suggesting how to close the video"
  }
}

Rules:
- Generate 4-6 beats total (including the opening hook as beat 1 if useful context,
  but the hook itself is already known — focus beats on what comes AFTER it)
- Beat labels should be structural, not generic: SETUP, TENSION, TURN, PAYOFF,
  PROOF, CTA — pick what fits this specific content, not a fixed list
- duration_hint should be realistic for the platform (Shorts/Reels/TikTok = under 60s total,
  scale beat durations accordingly)
- This is a SKELETON for the creator to fill in their own words around —
  do not write full dialogue or narration, keep each beat description
  to structural guidance only
- Stay grounded in the original script's actual topic — do not invent
  unrelated content

Platform: ${request.platform}
Framework: ${request.framework}
Tone: ${request.tone}
Audience: ${request.audience}
`.trim();

const buildExpansionUserPrompt = (request: ExpandHookRequest): string =>
  `
CHOSEN HOOK:
"""
${request.hook}
"""

ORIGINAL SCRIPT OR IDEA:
"""
${request.originalScript}
"""

Task:
Outline the rest of the video after the chosen hook. Keep the outline under 60 seconds total for ${request.platform}.
`.trim();

export const createExpandHookResponse = async ({
  apiKeys,
  body,
  ip = 'unknown',
  model = defaultGeminiModel,
}: ExpandHookHandlerOptions): Promise<HandlerResult<ExpandHookResponse>> => {
  const request = validateExpandBody(body);

  if ('error' in request) {
    console.warn(`[HookLab] Invalid expand request: ${request.error}`);
    return { status: 400, payload: { error: request.error } };
  }

  console.info(
    `[HookLab] Expand request accepted. framework=${request.framework}, ip=${ip}`,
  );

  if (!checkRateLimit(expandRateLimits, ip, 20)) {
    console.warn(`[HookLab] Expand rate limit exceeded for ip=${ip}`);
    return {
      status: 429,
      payload: { error: 'Too many requests. Try again in a bit.' },
    };
  }

  if (apiKeys.length === 0) {
    console.error('[HookLab] Expand failed before Gemini call: no API keys.');
    return {
      status: 500,
      payload: { error: 'Server is missing the Gemini API key.' },
    };
  }

  try {
    const text = await callGeminiWithRotation(
      apiKeys,
      model,
      buildExpansionSystemPrompt(request),
      buildExpansionUserPrompt(request),
    );
    const expansion = text ? parseExpansionPayload(text) : null;

    if (!expansion) {
      console.error('[HookLab] Expand payload parse failed.');
      return {
        status: 502,
        payload: { error: 'Something went wrong on our end. Try again.' },
      };
    }

    return { status: 200, payload: expansion };
  } catch (err) {
    if (err instanceof AllKeysExhaustedError) {
      return {
        status: 429,
        payload: {
          error:
            'Dont harass, the API limit is over. So please hold on, Hamza.',
        },
      };
    }
    if (err instanceof GeminiApiError) {
      console.error(
        `[HookLab] Returning expand Gemini error to client. status=${err.status}, message=${err.message}`,
      );
      return {
        status: err.status === 400 ? 400 : 502,
        payload: {
          error: err.message || 'Something went wrong on our end. Try again.',
        },
      };
    }
    console.error(`[HookLab] Unhandled expand failure: ${String(err)}`);
    return {
      status: 502,
      payload: { error: 'Something went wrong on our end. Try again.' },
    };
  }
};
