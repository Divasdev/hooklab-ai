import type {
  GenerateHooksRequest,
  GenerateHooksResponse,
  ExpandHookRequest,
  ExpandHookResponse,
  HookResult,
  HookScores,
  RewriteHookRequest,
  RewriteHookResponse,
  RoastCritique,
  CompareHooksResponse,
  CompareAnalysis,
} from '../types/hooks';

export class HookLabApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'HookLabApiError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isScore = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isHookScores = (value: unknown): value is HookScores => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isScore(value.curiosity) &&
    isScore(value.clarity) &&
    isScore(value.scroll_stop) &&
    isScore(value.platform_fit)
  );
};

const isOptionalString = (value: unknown): boolean =>
  value === undefined || typeof value === 'string';

const isHookResult = (value: unknown): value is HookResult => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.framework === 'string' &&
    typeof value.text === 'string' &&
    typeof value.why === 'string' &&
    (value.timecode === '00:00–00:05' || value.timecode === '00:00–00:08') &&
    isHookScores(value.scores) &&
    typeof value.best_pick === 'boolean' &&
    isOptionalString(value.on_screen_text) &&
    isOptionalString(value.visual)
  );
};

const isRewriteHookResponse = (
  value: unknown,
): value is RewriteHookResponse => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.text === 'string' &&
    typeof value.why === 'string' &&
    isHookScores(value.scores)
  );
};

const isRoastCritique = (value: unknown): value is RoastCritique => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.grade === 'string' &&
    Array.isArray(value.bullets) &&
    value.bullets.length >= 4 &&
    value.bullets.length <= 6 &&
    value.bullets.every(
      (bullet: unknown) => typeof bullet === 'string' && bullet.length > 0,
    ) &&
    typeof value.biggest_fix === 'string' &&
    value.biggest_fix.length > 0
  );
};

const isCompareAnalysis = (value: unknown): value is CompareAnalysis => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.winner === 'A' || value.winner === 'B') &&
    typeof value.reason === 'string' &&
    value.reason.length > 0
  );
};

const isCompareHooksResponse = (
  value: unknown,
): value is CompareHooksResponse => {
  if (!isRecord(value)) {
    return false;
  }

  if (value.winner !== 'A' && value.winner !== 'B') {
    return false;
  }

  if (!isRecord(value.analysis)) {
    return false;
  }

  return (
    typeof value.confidence === 'number' &&
    typeof value.summary === 'string' &&
    typeof value.improvedHook === 'string' &&
    isCompareAnalysis(value.analysis.clarity) &&
    isCompareAnalysis(value.analysis.curiosity) &&
    isCompareAnalysis(value.analysis.emotion) &&
    isCompareAnalysis(value.analysis.retention)
  );
};

const isExpandHookResponse = (value: unknown): value is ExpandHookResponse => {
  if (!isRecord(value) || !isRecord(value.outline)) {
    return false;
  }

  const outline = value.outline;

  return (
    typeof outline.hook_recap === 'string' &&
    Array.isArray(outline.beats) &&
    outline.beats.length >= 4 &&
    outline.beats.length <= 6 &&
    outline.beats.every(
      (beat: unknown) =>
        isRecord(beat) &&
        typeof beat.label === 'string' &&
        typeof beat.duration_hint === 'string' &&
        typeof beat.description === 'string',
    ) &&
    typeof outline.cta_suggestion === 'string'
  );
};

const parseGenerateHooksResponse = (value: unknown): GenerateHooksResponse => {
  if (!isRecord(value)) {
    throw new Error('Invalid response shape.');
  }

  if (value.mode === 'compare') {
    if (isCompareHooksResponse(value.compare)) {
      return { mode: 'compare', compare: value.compare };
    }
    throw new Error('Invalid compare payload.');
  }

  if (!Array.isArray(value.hooks) || !value.hooks.every(isHookResult)) {
    throw new Error('Invalid hooks payload.');
  }

  if (value.mode === 'roast') {
    if (value.roast !== undefined && isRoastCritique(value.roast)) {
      return { mode: 'roast', hooks: value.hooks, roast: value.roast };
    }
    throw new Error('Invalid roast payload.');
  }

  return { mode: 'generate', hooks: value.hooks };
};

const parseErrorMessage = (value: unknown): string | null => {
  if (!isRecord(value)) {
    return null;
  }

  const error = value.error;

  return typeof error === 'string' && error.trim().length > 0 ? error : null;
};

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    throw new HookLabApiError("Couldn't read the hook cut. Try again.", 500);
  }
};

const throwApiError = (status: number, payload: unknown): never => {
  if (status === 429) {
    throw new HookLabApiError(
      "Slow down — you've hit the rate limit. Try again in a bit.",
      status,
    );
  }

  if (status === 400) {
    throw new HookLabApiError(
      parseErrorMessage(payload) ?? 'Check the input and try again.',
      status,
    );
  }

  throw new HookLabApiError(
    'Something went wrong on our end. Try again.',
    status,
  );
};

const readHookStream = async (
  response: Response,
  onPreview: (hooks: HookResult[]) => void,
): Promise<GenerateHooksResponse> => {
  if (!response.body) {
    throw new HookLabApiError("Couldn't read the hook cut. Try again.", 500);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let preview: HookResult[] = [];

  for (;;) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split('\n');
    buffer = done ? '' : (lines.pop() ?? '');

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as unknown;
      if (!isRecord(event)) continue;

      if (event.type === 'hook' && isHookResult(event.hook)) {
        preview = [...preview, event.hook];
        onPreview(preview);
      } else if (event.type === 'reset') {
        preview = [];
        onPreview(preview);
      } else if (event.type === 'result' && typeof event.status === 'number') {
        if (event.status < 200 || event.status >= 300) {
          throwApiError(event.status, event.payload);
        }
        return parseGenerateHooksResponse(event.payload);
      }
    }

    if (done) break;
  }

  throw new HookLabApiError("Couldn't read the hook cut. Try again.", 500);
};

/**
 * With `onPreview`, hooks are streamed and reported as each one finishes;
 * the returned value is always the complete, validated response.
 */
export const generateHooks = async (
  request: GenerateHooksRequest,
  onPreview?: (hooks: HookResult[]) => void,
): Promise<GenerateHooksResponse> => {
  const response = await fetch('/api/generate-hooks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(onPreview ? { Accept: 'application/x-ndjson' } : {}),
    },
    body: JSON.stringify(request),
  });

  if (
    onPreview &&
    response.ok &&
    response.headers.get('Content-Type')?.includes('application/x-ndjson')
  ) {
    return readHookStream(response, onPreview);
  }

  const payload = await readJson(response);

  if (!response.ok) {
    throwApiError(response.status, payload);
  }

  return parseGenerateHooksResponse(payload);
};

export const rewriteHook = async (
  request: RewriteHookRequest,
): Promise<RewriteHookResponse> => {
  const response = await fetch('/api/rewrite-hook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const payload = await readJson(response);

  if (!response.ok) {
    throwApiError(response.status, payload);
  }

  if (!isRewriteHookResponse(payload)) {
    throw new HookLabApiError(
      'Something went wrong on our end. Try again.',
      500,
    );
  }

  return payload;
};

export const expandHook = async (
  request: ExpandHookRequest,
): Promise<ExpandHookResponse> => {
  const response = await fetch('/api/expand-hook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const payload = await readJson(response);

  if (!response.ok) {
    throwApiError(response.status, payload);
  }

  if (!isExpandHookResponse(payload)) {
    throw new HookLabApiError(
      'Something went wrong on our end. Try again.',
      500,
    );
  }

  return payload;
};
