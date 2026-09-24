import assert from 'node:assert/strict';

import {
  buildSharePageHtml,
  renderShareImage,
} from '../src/server/sharePreview.ts';

const hook = {
  text: 'Pilots don’t panic when an engine fails. <script>alert(1)</script> Here’s why.',
  framework: 'BOLD CLAIM',
  platform: 'TikTok',
};

const html = buildSharePageHtml(hook, 'https://hooklab.example');
assert.ok(!html.includes('<script>alert(1)</script>'), 'Hook text is escaped');
assert.match(
  html,
  /property="og:image" content="https:\/\/hooklab\.example\/api\/og\?h=/,
);
assert.match(html, /name="twitter:card" content="summary_large_image"/);
assert.match(html, /location\.replace\("https:\/\/hooklab\.example\/\?h=/);
assert.ok(
  !/location\.replace\([^)]*<\//.test(html),
  'Redirect script cannot close its tag',
);

const png = await renderShareImage(hook);
assert.equal(png.subarray(1, 4).toString(), 'PNG');
assert.equal(png.readUInt32BE(16), 1200);
assert.equal(png.readUInt32BE(20), 630);

console.log('Share page escaping and 1200x630 preview image tests passed.');
