import assert from 'node:assert/strict';
import { build } from 'esbuild';

const load = async (file) => {
  const result = await build({
    entryPoints: [file],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
  );
};

const { parseSavedHooks, buildSavedHooksCsv, savedHookMatches } = await load(
  'src/utils/savedHooks.ts',
);
const saved = {
  id: 'one',
  text: '=SUM(1,2)',
  framework: 'CURIOSITY GAP',
  platform: 'TikTok',
  labels: 'fitness, launch',
  createdAt: 1,
};
assert.deepEqual(parseSavedHooks(null), []);
assert.throws(() => parseSavedHooks('{broken'));
assert.throws(() => parseSavedHooks('{}'));
assert.deepEqual(
  parseSavedHooks(
    JSON.stringify([
      null,
      {},
      saved,
      saved,
      { ...saved, id: 'two', platform: 'wrong' },
    ]),
  ),
  [saved],
);
assert.equal(savedHookMatches(saved, saved.text, 'TikTok'), true);
assert.equal(savedHookMatches(saved, saved.text, 'YouTube Shorts'), false);
assert.ok(buildSavedHooksCsv([saved]).includes('"\'=SUM(1,2)"'));
assert.ok(
  buildSavedHooksCsv([
    { ...saved, text: 'A "quoted" hook\nnext line' },
  ]).includes('"A ""quoted"" hook\nnext line"'),
);

const { createExpandHookResponse } = await load(
  'src/server/scriptExpansion.ts',
);
const body = {
  hook: 'My editing mistake cost me hours.',
  framework: 'STORY OPEN',
  platform: 'TikTok',
  originalScript:
    'I fixed my editing workflow after wasting hours on subtitles.',
  tone: 'Punchy',
  audience: 'Creators',
};
const outline = {
  hook_recap: 'Changed by model',
  beats: Array.from({ length: 4 }, (_, i) => ({
    label: ['SETUP', 'TENSION', 'TURN', 'PAYOFF'][i],
    duration_hint: `0:${10 + i * 10}-0:${20 + i * 10}`,
    description: 'Show the relevant step in the editing workflow.',
  })),
  cta_suggestion: 'Invite viewers to try the workflow.',
};
const originalFetch = globalThis.fetch;
const originalConsole = {
  info: console.info,
  warn: console.warn,
  error: console.error,
};
const logs = [];
for (const key of Object.keys(originalConsole))
  console[key] = (...args) => logs.push(args.join(' '));
let calls = 0;
const success = (payload) =>
  new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: payload }] } }],
    }),
    { status: 200 },
  );
try {
  const invoke = (overrides = {}) =>
    createExpandHookResponse({
      body,
      apiKeys: ['private-test-key'],
      ip: crypto.randomUUID(),
      ...overrides,
    });
  globalThis.fetch = async () => {
    calls++;
    return success('```json\n' + JSON.stringify({ outline }) + '\n```');
  };
  assert.equal(
    (await invoke({ body: { ...body, platform: 'bad' } })).status,
    400,
  );
  assert.equal(calls, 0);
  assert.equal((await invoke({ apiKeys: [] })).status, 500);
  const result = await invoke();
  assert.equal(result.status, 200);
  assert.equal(result.payload.outline.hook_recap, body.hook);
  assert.equal(result.payload.outline.beats.length, 4);
  globalThis.fetch = async () =>
    success(
      JSON.stringify({
        outline: { ...outline, beats: outline.beats.slice(0, 3) },
      }),
    );
  assert.equal((await invoke()).status, 502);
  globalThis.fetch = async () => success('private malformed script');
  assert.equal((await invoke()).status, 502);
  let rotationCalls = 0;
  globalThis.fetch = async () =>
    ++rotationCalls === 1
      ? new Response('{}', { status: 429 })
      : success(JSON.stringify({ outline }));
  assert.equal(
    (await invoke({ apiKeys: ['first-private-key', 'second-private-key'] }))
      .status,
    200,
  );
  assert.equal(rotationCalls, 2);
  globalThis.fetch = async () => new Response('{}', { status: 429 });
  const exhausted = await invoke();
  assert.equal(exhausted.status, 429);
  assert.match(exhausted.payload.error, /Hamza/);
  calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return success(JSON.stringify({ outline }));
  };
  for (let i = 0; i < 20; i++)
    assert.equal((await invoke({ ip: 'limited-client' })).status, 200);
  assert.equal((await invoke({ ip: 'limited-client' })).status, 429);
  assert.equal(calls, 20);
  assert.ok(
    !logs.some((line) => /private|limited-client|editing mistake/.test(line)),
    'Logs must not contain scripts, keys, or client IPs',
  );
} finally {
  globalThis.fetch = originalFetch;
  Object.assign(console, originalConsole);
}
console.log(
  'Saved library, CSV, expansion validation, key rotation, rate limiting and privacy tests passed.',
);
