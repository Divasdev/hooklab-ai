import type { VercelRequest, VercelResponse } from '@vercel/node';

import { renderShareImage } from '../src/server/sharePreview.js';
import { parseSharedHook } from '../src/utils/shareLink.js';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  const hook = parseSharedHook(new URL(request.url ?? '/', 'http://x').search);

  if (!hook) {
    response.status(400).json({ error: 'Missing hook.' });
    return;
  }

  try {
    const png = await renderShareImage(hook);
    response.setHeader('Content-Type', 'image/png');
    // The image is fully determined by the URL, so it can be cached for a long time.
    response.setHeader(
      'Cache-Control',
      'public, max-age=86400, s-maxage=31536000, immutable',
    );
    response.status(200).send(png);
  } catch {
    console.error('[HookLab] Share image render failed.');
    response.status(500).json({ error: 'Could not render the preview.' });
  }
}
