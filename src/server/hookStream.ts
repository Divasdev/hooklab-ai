import type { ServerResponse } from 'node:http';

import {
  createGenerateHooksResponse,
  type GenerateHooksHandlerOptions,
} from './hookGeneration.js';

export const hookStreamContentType = 'application/x-ndjson';

export const wantsHookStream = (
  accept: string | string[] | undefined,
): boolean =>
  (Array.isArray(accept) ? accept.join(',') : (accept ?? '')).includes(
    hookStreamContentType,
  );

/**
 * Writes one JSON object per line: `hook` and `reset` events while the model is
 * generating, then a final `result` line carrying the usual status and payload.
 */
export const streamGenerateHooks = async (
  response: ServerResponse,
  options: Omit<GenerateHooksHandlerOptions, 'onEvent'>,
): Promise<void> => {
  response.statusCode = 200;
  response.setHeader('Content-Type', `${hookStreamContentType}; charset=utf-8`);
  response.setHeader('Cache-Control', 'no-cache, no-transform');
  response.setHeader('X-Accel-Buffering', 'no');

  const writeLine = (line: unknown): void => {
    response.write(`${JSON.stringify(line)}\n`);
  };

  const result = await createGenerateHooksResponse({
    ...options,
    onEvent: writeLine,
  });

  writeLine({ type: 'result', status: result.status, payload: result.payload });
  response.end();
};
