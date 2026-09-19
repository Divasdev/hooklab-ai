# HookLab.AI API Reference

All routes accept JSON via POST. Vercel also accepts OPTIONS for preflight;
unsupported methods return 405. Error bodies use `{ "error": "message" }`.
API keys are server-only. There is no public diagnostics endpoint.

## Shared controls

All listed controls are required unless a default is explicitly stated.

| Field      | Allowed values                                  |
| ---------- | ----------------------------------------------- |
| platform   | YouTube Shorts, Instagram Reels, TikTok         |
| tone       | Punchy, Clean, Controversial, Story             |
| audience   | Beginners, Creators, Business, Fitness, Finance |
| intensity  | Safe, Sharp, Aggressive                         |
| language   | English, Hinglish, Hindi                        |
| hookWindow | 5, 8 (number)                                   |

## POST /api/generate-hooks

Accepts `script`, all shared controls, and `mode` (`generate`, `roast`, or
`compare`; defaults to `generate`). Compare additionally requires `hookB`.
Scripts are 20-3000 characters after trimming, or 5-3000 in Roast.
Compare's second hook is also 20-3000 characters.

```json
{
  "script": "I spent a month improving my editing workflow.",
  "platform": "YouTube Shorts",
  "tone": "Punchy",
  "audience": "Creators",
  "intensity": "Sharp",
  "language": "English",
  "hookWindow": 5,
  "mode": "generate"
}
```

Generate returns `{ mode: "generate", hooks: HookResult[] }` with ten hooks.
Each hook has `framework`, `text`, `why`, `timecode`, `scores` (curiosity,
clarity, scroll_stop, platform_fit), and `best_pick`. Scores are AI estimates.

Roast returns `{ mode: "roast", hooks, roast: { grade, bullets, biggest_fix } }`.
Compare returns `{ mode: "compare", compare: { winner, confidence, summary,
analysis, improvedHook } }`. Winner is A or B. Analysis contains clarity,
curiosity, emotion and retention, each with `winner` and `reason`.

Rate limit: 10 requests per IP per hour, shared by these modes.

## POST /api/rewrite-hook

Accepts `hook` (1-600 characters), `framework` (one of the ten generated
frameworks), `direction`, `platform`, and `hookWindow`.
Directions: Shorter, More Emotional, More Controversial, Clearer, Less Clickbait.
Returns `{ text, why, scores }`. Rate limit: 20 requests per IP per hour.

## POST /api/expand-hook

Accepts `hook` (1-600 characters), `framework` (1-80), `originalScript`
(5-3000), `platform`, `tone`, and `audience`.
Returns `{ outline: { hook_recap, beats, cta_suggestion } }`.
There are 4-6 beats, each with `label`, `duration_hint`, and `description`.
The recap preserves the chosen hook. This is structural guidance, not a
finished script. Outlines are not persisted.

Rate limit: 20 requests per IP per hour, separate from rewriting.

## Errors and operations

- 400: invalid input or upstream bad request.
- 429: per-IP limit or all configured Gemini keys rate-limited.
- 500: no server API key configured.
- 502: invalid model output, grounding failure, or upstream failure.

Keys rotate on upstream 429 responses. The existing all-keys-exhausted
fallback is preserved. Limits use process-local memory: they reset on cold
starts and are not a global abuse-control guarantee across server instances.
All three production functions have a 60-second maximum duration. Local Vite
development supports the same three POST paths.

## Local saved library

Saved hooks use `hooklab_saved_hooks_v1` in browser localStorage, with a
200-hook capacity. Each record stores the hook text, framework, platform,
labels and creation time. No additional API, account, database, or outline
persistence is involved. Copy, CSV and PNG exports are generated locally.
