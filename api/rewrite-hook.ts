import type { VercelRequest, VercelResponse } from '@vercel/node';

import { createRewriteHookResponse } from '../src/server/hookGeneration';

const getRequestIp = (request: VercelRequest): string => {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.socket.remoteAddress ?? 'unknown';
};

const getApiKeys = (): string[] =>
  [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
  ].filter((key): key is string => typeof key === 'string' && key.length > 0);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const result = await createRewriteHookResponse({
    apiKeys: getApiKeys(),
    body: request.body,
    ip: getRequestIp(request),
  });

  response.status(result.status).json(result.payload);
}
