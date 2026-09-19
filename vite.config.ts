import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, loadEnv, type Plugin } from 'vite';

import {
  createGenerateHooksResponse,
  createRewriteHookResponse,
  defaultGeminiModel,
} from './src/server/hookGeneration.js';
import { createExpandHookResponse } from './src/server/scriptExpansion.js';

const readRequestBody = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Uint8Array[] = [];

  for await (const chunk of request) {
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
    } else if (chunk instanceof Uint8Array) {
      chunks.push(chunk);
    }
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');

  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody) as unknown;
};

const sendJson = (
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
): void => {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
};

const getApiKeysFromEnv = (): string[] =>
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

const localApiPlugin = (envApiKeys: string[], geminiModel: string): Plugin => ({
  name: 'virality-ai-local-api',
  configureServer(server) {
    const handleLocalApiRequest = async (
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> => {
      if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        sendJson(response, 405, { error: 'Method not allowed.' });
        return;
      }

      try {
        const body = await readRequestBody(request);
        const apiKeys =
          envApiKeys.length > 0 ? envApiKeys : getApiKeysFromEnv();
        const result = await createGenerateHooksResponse({
          apiKeys,
          body,
          ip: request.socket.remoteAddress ?? 'unknown',
          model: geminiModel,
        });

        sendJson(response, result.status, result.payload);
      } catch (error) {
        sendJson(response, 500, {
          error:
            error instanceof SyntaxError
              ? 'Invalid JSON body.'
              : 'Could not cut those hooks.',
        });
      }
    };

    const handleLocalRewriteRequest = async (
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> => {
      if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        sendJson(response, 405, { error: 'Method not allowed.' });
        return;
      }

      try {
        const body = await readRequestBody(request);
        const apiKeys =
          envApiKeys.length > 0 ? envApiKeys : getApiKeysFromEnv();
        const handler = request.url?.startsWith('/api/expand-hook')
          ? createExpandHookResponse
          : createRewriteHookResponse;
        const result = await handler({
          apiKeys,
          body,
          ip: request.socket.remoteAddress ?? 'unknown',
          model: geminiModel,
        });

        sendJson(response, result.status, result.payload);
      } catch (error) {
        sendJson(response, 500, {
          error:
            error instanceof SyntaxError
              ? 'Invalid JSON body.'
              : 'Could not rewrite that hook.',
        });
      }
    };

    server.middlewares.use('/api/generate-hooks', (request, response) => {
      void handleLocalApiRequest(request, response);
    });

    server.middlewares.use((request, response, next) => {
      if (
        ['/api/rewrite-hook', '/api/expand-hook'].includes(
          request.url?.split('?')[0] ?? '',
        )
      ) {
        void handleLocalRewriteRequest(request, response);
      } else {
        next();
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const apiKeys = [
    env.GEMINI_API_KEY,
    env.GEMINI_API_KEY_1,
    env.GEMINI_API_KEY_2,
    env.GEMINI_API_KEY_3,
    env.GEMINI_API_KEY_4,
    env.GEMINI_API_KEY_5,
  ]
    .map((key) => key?.trim())
    .filter((key): key is string => typeof key === 'string' && key.length > 0);

  return {
    plugins: [
      react(),
      localApiPlugin(apiKeys, env.GEMINI_MODEL?.trim() || defaultGeminiModel),
    ],
  };
});
