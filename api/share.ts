import type { VercelRequest, VercelResponse } from '@vercel/node';

import { buildSharePageHtml } from '../src/server/sharePreview.js';
import { parseSharedHook } from '../src/utils/shareLink.js';

const requestOrigin = (request: VercelRequest): string => {
  const protocol = request.headers['x-forwarded-proto'] ?? 'https';
  return `${String(protocol).split(',')[0]}://${request.headers.host ?? 'localhost'}`;
};

export default function handler(
  request: VercelRequest,
  response: VercelResponse,
): void {
  const hook = parseSharedHook(new URL(request.url ?? '/', 'http://x').search);

  if (!hook) {
    response.redirect(302, '/');
    return;
  }

  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
  response.status(200).send(buildSharePageHtml(hook, requestOrigin(request)));
}
