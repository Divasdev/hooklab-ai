import { ImageResponse } from '@vercel/og';
import type { ReactElement } from 'react';

import type { SharedHook } from '../utils/shareLink.js';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const shareQuery = (hook: SharedHook): string =>
  new URLSearchParams({
    h: hook.text,
    f: hook.framework,
    p: hook.platform,
  }).toString();

const shorten = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;

/**
 * Link crawlers never run the app's JavaScript, so shared hooks get a tiny
 * server-rendered page carrying the preview tags, which then opens the app.
 */
export const buildSharePageHtml = (
  hook: SharedHook,
  origin: string,
): string => {
  const appUrl = `${origin}/?${shareQuery(hook)}`;
  const imageUrl = `${origin}/api/og?${shareQuery(hook)}`;
  const title = escapeHtml(shorten(hook.text, 90));
  const description = escapeHtml(
    `A ${hook.framework ? `${hook.framework.toLowerCase()} ` : ''}hook for ${hook.platform}. Roast it or write your own with HookLab.AI.`,
  );

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="HookLab.AI" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${escapeHtml(appUrl)}" />
<meta property="og:image" content="${escapeHtml(imageUrl)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
<meta http-equiv="refresh" content="0; url=${escapeHtml(appUrl)}" />
</head>
<body style="background:#08090B;color:#E8EAED;font-family:system-ui,sans-serif;padding:24px">
<p><a style="color:#D99A2B" href="${escapeHtml(appUrl)}">Open this hook in HookLab.AI</a></p>
<script>location.replace(${JSON.stringify(appUrl).replace(/</g, '\\u003c')});</script>
</body>
</html>`;
};

type Node = { type: string; props: Record<string, unknown> };
const box = (style: Record<string, unknown>, children?: unknown): Node => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});

export const renderShareImage = async (hook: SharedHook): Promise<Buffer> => {
  const text = shorten(hook.text, 170);
  const tree = box(
    {
      width: '100%',
      height: '100%',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: '#08090B',
      color: '#E8EAED',
      padding: '72px 80px',
      fontFamily: 'sans-serif',
    },
    [
      box({ flexDirection: 'column' }, [
        box({ width: 72, height: 6, background: '#D99A2B', marginBottom: 28 }),
        box(
          { fontSize: 26, letterSpacing: 4, color: '#D99A2B' },
          hook.framework || 'HOOK',
        ),
        box(
          {
            fontSize: text.length > 110 ? 48 : 62,
            fontWeight: 700,
            lineHeight: 1.15,
            marginTop: 28,
          },
          text,
        ),
      ]),
      box({ justifyContent: 'space-between', fontSize: 28 }, [
        box({ color: '#A5ADB8' }, hook.platform),
        box({ color: '#3FBCCB' }, 'Made with HookLab.AI'),
      ]),
    ],
  );

  const image = new ImageResponse(tree as unknown as ReactElement, {
    width: 1200,
    height: 630,
  });
  return Buffer.from(await image.arrayBuffer());
};
