import type { VercelRequest, VercelResponse } from '@vercel/node';

import {
  createGenerateHooksResponse,
  defaultGeminiModel,
} from '../src/server/hookGeneration.js';

export const maxDuration = 60;

const setCorsHeaders = (response: VercelResponse): void => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const getRequestIp = (request: VercelRequest): string => {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.socket.remoteAddress ?? 'unknown';
};

const getApiKeys = (): string[] =>
  Array.from(
    new Set(
      [
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3,
        process.env.GEMINI_API_KEY_4,
        process.env.GEMINI_API_KEY_5,
      ]
        .map((key) => key?.trim())
        .filter(
          (key): key is string => typeof key === 'string' && key.length > 0,
        ),
    ),
  );

const getGeminiModel = (): string =>
  process.env.GEMINI_MODEL?.trim() || defaultGeminiModel;

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const VALID_PLATFORMS = ['YouTube Shorts', 'Instagram Reels', 'TikTok'];
  const body = (request.body as Record<string, unknown>) || {};
  
  const platform = typeof body.platform === 'string' ? body.platform : undefined;
  const tone = typeof body.tone === 'string' ? body.tone : undefined;
  const audience = typeof body.audience === 'string' ? body.audience : undefined;
  const intensity = typeof body.intensity === 'string' ? body.intensity : undefined;
  const language = typeof body.language === 'string' ? body.language : undefined;
  const scriptStr = typeof body.script === 'string' ? body.script : undefined;

  // Log exactly what the frontend is sending
  console.info('[HookLab] Received:', { 
    platform, 
    tone, 
    audience, 
    intensity, 
    language,
    scriptLength: scriptStr?.length 
  });
  
  if (platform && !VALID_PLATFORMS.includes(platform)) {
    console.error(`[HookLab] Invalid platform received: "${platform}"`);
    response.status(400).json({ 
      error: `Invalid platform: "${platform}". Expected one of: ${VALID_PLATFORMS.join(", ")}` 
    });
    return;
  }

  const result = await createGenerateHooksResponse({
    apiKeys: getApiKeys(),
    body: request.body,
    ip: getRequestIp(request),
    model: getGeminiModel(),
  });

  response.status(result.status).json(result.payload);
}
