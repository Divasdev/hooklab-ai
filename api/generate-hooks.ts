import type { VercelRequest, VercelResponse } from '@vercel/node';

import { createGenerateHooksResponse } from '../src/server/hookGeneration';

const getRequestIp = (request: VercelRequest): string => {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.socket.remoteAddress ?? 'unknown';
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const result = await createGenerateHooksResponse({
    apiKey: process.env.GEMINI_API_KEY,
    body: request.body,
    ip: getRequestIp(request),
  });

  response.status(result.status).json(result.payload);
}
