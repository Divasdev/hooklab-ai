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

const { estimateSpeakSeconds, speakFit } = await load('src/utils/speakTime.ts');
assert.equal(estimateSpeakSeconds(''), 0);
assert.equal(estimateSpeakSeconds('one two three four five six seven'), 2.5);
assert.ok(
  estimateSpeakSeconds('Stop. Read this. Now.') >
    estimateSpeakSeconds('Stop read this now'),
  'Sentence breaks add pause time',
);
assert.equal(speakFit(3, 5), 'fits');
assert.equal(speakFit(4.5, 5), 'tight');
assert.equal(speakFit(5.1, 5), 'over');

const { buildShareUrl, parseSharedHook } = await load('src/utils/shareLink.ts');
const sharedUrl = new URL(
  buildShareUrl(
    {
      text: 'Pilots don’t panic & here’s why?',
      framework: 'BOLD CLAIM',
      platform: 'TikTok',
    },
    'https://example.test',
  ),
);
assert.deepEqual(parseSharedHook(sharedUrl.search), {
  text: 'Pilots don’t panic & here’s why?',
  framework: 'BOLD CLAIM',
  platform: 'TikTok',
});
assert.equal(parseSharedHook('?h=hi&p=MySpace'), null);
assert.equal(parseSharedHook('?p=TikTok'), null);
assert.equal(
  parseSharedHook(`?h=${'x'.repeat(900)}&p=TikTok`).text.length,
  400,
);

const { parseDraft, defaultDraft } = await load('src/utils/draft.ts');
assert.deepEqual(parseDraft(null), defaultDraft);
assert.deepEqual(parseDraft('{broken'), defaultDraft);
assert.deepEqual(
  parseDraft(
    JSON.stringify({
      script: 'keep me',
      platform: 'TikTok',
      tone: 'Nope',
      hookWindow: 8,
    }),
  ),
  { ...defaultDraft, script: 'keep me', platform: 'TikTok', hookWindow: 8 },
);

const { buildHooksCsv, buildHooksPlainText } = await load(
  'src/utils/export.ts',
);
const exportHook = {
  framework: 'STAT SHOCK',
  text: '-50% of pilots never say this',
  why: 'Numbers stop the scroll.',
  timecode: '00:00–00:05',
  scores: { curiosity: 1, clarity: 2, scroll_stop: 3, platform_fit: 4 },
  best_pick: true,
  on_screen_text: '=HYPERLINK("x")',
  visual: 'Cockpit close-up.',
};
const exportCsv = buildHooksCsv([exportHook]);
assert.ok(exportCsv.includes(`"'-50% of pilots never say this"`));
assert.ok(exportCsv.includes(`"'=HYPERLINK(""x"")"`));
assert.ok(exportCsv.includes('"Cockpit close-up."'));
assert.ok(
  buildHooksPlainText([exportHook]).includes('Visual: Cockpit close-up.'),
);

const { createGenerateHooksResponse } = await load(
  'src/server/hookGeneration.ts',
);
const frameworks = [
  'CURIOSITY GAP',
  'BOLD CLAIM',
  'PATTERN INTERRUPT',
  'STORY OPEN',
  'CONTROVERSY',
  'STAT SHOCK',
  'DIRECT CALLOUT',
  'COLD OPEN',
  'QUESTION HOOK',
  'STAKES FIRST',
];
const generateBody = {
  script:
    "Most passengers panic when they hear about an engine failure. Pilots don't. Modern airliners are designed to fly safely even after losing one engine.",
  platform: 'Instagram Reels',
  tone: 'Clean',
  audience: 'Beginners',
  intensity: 'Safe',
  language: 'English',
  hookWindow: 5,
  mode: 'generate',
};
const modelHooks = (withOverlay) =>
  frameworks.map((framework, index) => ({
    framework,
    text: 'Engine failure mid-flight? Pilots stay calm because airliners fly safely on one engine.',
    why: 'Uses the engine failure fear from the source to open a gap.',
    timecode: '00:00–00:05',
    scores: { curiosity: 80, clarity: 80, scroll_stop: 80, platform_fit: 80 },
    best_pick: index === 0,
    ...(withOverlay
      ? {
          on_screen_text: '  One engine is enough  ',
          visual: 'Wing engine through the cabin window.',
        }
      : {}),
  }));
try {
  console.warn = console.error = console.info = () => {};
  globalThis.fetch = async () =>
    success(JSON.stringify({ hooks: modelHooks(true) }));
  const withOverlay = await createGenerateHooksResponse({
    body: generateBody,
    apiKeys: ['overlay-key'],
    ip: crypto.randomUUID(),
  });
  assert.equal(withOverlay.status, 200);
  assert.equal(
    withOverlay.payload.hooks[0].on_screen_text,
    'One engine is enough',
  );
  assert.equal(
    withOverlay.payload.hooks[0].visual,
    'Wing engine through the cabin window.',
  );
  globalThis.fetch = async () =>
    success(JSON.stringify({ hooks: modelHooks(false) }));
  const withoutOverlay = await createGenerateHooksResponse({
    body: generateBody,
    apiKeys: ['overlay-key'],
    ip: crypto.randomUUID(),
  });
  assert.equal(
    withoutOverlay.status,
    200,
    'Hooks without overlay fields still succeed',
  );
  assert.equal(withoutOverlay.payload.hooks[0].on_screen_text, undefined);
} finally {
  globalThis.fetch = originalFetch;
  Object.assign(console, originalConsole);
}

console.log(
  'Saved library, CSV, expansion validation, key rotation, rate limiting, privacy, speak time, share link, draft and first-frame tests passed.',
);
