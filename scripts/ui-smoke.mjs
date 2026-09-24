import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHANNEL
    ? { channel: process.env.PLAYWRIGHT_CHANNEL }
    : {}),
});
const output = await mkdtemp(join(tmpdir(), 'hooklab-ui-'));
const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:5174';
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
const makeHooks = (mode) =>
  frameworks.map((framework, index) => ({
    framework,
    text: `${mode === 'roast' ? 'Rewritten' : 'Original'} hook ${index + 1}: this editing mistake cost me hours.`,
    why: 'Opens a specific question about the editing workflow.',
    timecode: '00:00–00:05',
    best_pick: index === 0,
    scores: { curiosity: 80, clarity: 88, scroll_stop: 81, platform_fit: 90 },
  }));
const outline = (hook) => ({
  outline: {
    hook_recap: hook,
    beats: ['SETUP', 'TENSION', 'TURN', 'PAYOFF'].map((label, index) => ({
      label,
      duration_hint: `0:${10 + index * 10}-0:${20 + index * 10}`,
      description: 'Show the relevant part of the editing workflow.',
    })),
    cta_suggestion: 'Invite viewers to try the workflow.',
  },
});

try {
  for (const width of [375, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let expansionBody;
    let failExpansion = false;
    await page.route('**/api/generate-hooks', async (route) => {
      const request = route.request().postDataJSON();
      const payload =
        request.mode === 'compare'
          ? {
              mode: 'compare',
              compare: {
                winner: 'A',
                confidence: 82,
                summary: 'A makes the editing problem more specific.',
                analysis: Object.fromEntries(
                  ['clarity', 'curiosity', 'emotion', 'retention'].map(
                    (key) => [
                      key,
                      {
                        winner: 'A',
                        reason: 'The opening has a more concrete promise.',
                      },
                    ],
                  ),
                ),
                improvedHook:
                  'This tiny editing change saved me an entire afternoon.',
              },
            }
          : {
              mode: request.mode,
              hooks: makeHooks(request.mode),
              ...(request.mode === 'roast'
                ? {
                    roast: {
                      grade: 'B',
                      bullets: [
                        'Be specific.',
                        'Show the stakes.',
                        'Tighten the wording.',
                        'Make the payoff clear.',
                      ],
                      biggest_fix: 'Name the editing mistake.',
                    },
                  }
                : {}),
            };
      await route.fulfill({ json: payload });
    });
    await page.route('**/api/expand-hook', async (route) => {
      expansionBody = route.request().postDataJSON();
      await new Promise((resolve) => setTimeout(resolve, 250));
      await route.fulfill(
        failExpansion
          ? { status: 429, json: { error: 'Rate limited' } }
          : { json: outline(expansionBody.hook) },
      );
    });
    await page.goto(baseURL);
    await page
      .getByRole('textbox', { name: 'Your script' })
      .fill('I spent a month improving my editing workflow and saved hours.');
    await page
      .getByRole('button', { name: 'Cut 10 Hooks', exact: true })
      .click();
    const cards = page
      .locator('article')
      .filter({
        has: page.getByRole('button', { name: 'More actions' }),
      });
    await cards.first().waitFor();
    const first = cards.first();
    assert.equal(
      await first.evaluate((element) => getComputedStyle(element).opacity),
      '1',
      'Cards must be visible with reduced motion',
    );
    await first.getByRole('button', { name: 'Save hook', exact: true }).click();
    await cards
      .nth(1)
      .getByRole('button', { name: 'Save hook', exact: true })
      .click();
    await first.getByRole('button', { name: /^Copy( hook)?$/ }).click();
    assert.match(
      await page.evaluate(() => navigator.clipboard.readText()),
      /Original hook 1/,
    );
    const pngDownload = page.waitForEvent('download');
    await first.getByRole('button', { name: 'More actions' }).click();
    await first.getByRole('button', { name: 'Save as image' }).click();
    const png = await pngDownload;
    const pngPath = join(output, `hook-${width}.png`);
    await png.saveAs(pngPath);
    const bytes = await readFile(pngPath);
    assert.equal(bytes.readUInt32BE(16), 1080);
    assert.ok(bytes.length > 10000, 'Export should contain rendered text');
    await first.getByRole('button', { name: /Turn into script outline/ }).click();
    await first.getByRole('button', { name: 'Building outline…' }).waitFor();
    const outlineDialog = page.getByRole('dialog', { name: 'Script outline' });
    await outlineDialog.waitFor();
    await outlineDialog.getByRole('button', { name: 'Copy Outline' }).click();
    assert.match(
      await page.evaluate(() => navigator.clipboard.readText()),
      /1\. SETUP/,
    );
    await page.screenshot({ path: join(output, `outline-${width}.png`) });
    await page.keyboard.press('Escape');
    failExpansion = true;
    await first.getByRole('button', { name: /Turn into script outline/ }).click();
    await first.getByText(/hit the rate limit/).waitFor();
    failExpansion = false;
    await page.getByRole('button', { name: /Open saved hooks/ }).click();
    const library = page.getByRole('dialog', { name: /Saved Hooks/ });
    await library.waitFor();
    await library
      .getByRole('textbox', { name: /Labels for Original hook 1/ })
      .fill('launch, editing');
    await library.getByRole('searchbox').fill('launch');
    assert.equal(await library.locator('article').count(), 1);
    await library.getByRole('combobox').selectOption('TikTok');
    await library.getByText('No hooks match these filters.').waitFor();
    await library.getByRole('combobox').selectOption('');
    await library.getByRole('checkbox', { name: /Select visible/ }).check();
    const csvDownload = page.waitForEvent('download');
    await library.getByRole('button', { name: 'Export CSV' }).click();
    const csv = await csvDownload;
    const csvPath = join(output, `hooks-${width}.csv`);
    await csv.saveAs(csvPath);
    assert.match(await readFile(csvPath, 'utf8'), /launch, editing/);
    await library.getByRole('searchbox').fill('');
    await library.getByRole('checkbox', { name: /Select visible/ }).check();
    await page.screenshot({ path: join(output, `library-${width}.png`) });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    assert.equal(overflow, false, `No horizontal overflow at ${width}`);
    await library.getByRole('button', { name: 'Compare 2' }).click();
    await page.locator('button[type="submit"]').click();
    await page.getByText('Winner: Hook A', { exact: true }).waitFor();
    await page
      .getByRole('textbox', { name: 'Hook A', exact: true })
      .fill('This is an edited draft unrelated to the completed result.');
    await page.getByRole('button', { name: /Expand into outline/ }).click();
    await outlineDialog.waitFor();
    assert.match(expansionBody.hook, /Original hook/);
    assert.equal(expansionBody.platform, 'YouTube Shorts');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Save hook', exact: true }).click();
    await page.screenshot({ path: join(output, `compare-${width}.png`) });
    await page.reload();
    await page.getByRole('button', { name: /Open saved hooks \(3\)/ }).click();
    assert.equal(await library.locator('article').count(), 3);
    await library.getByRole('searchbox').fill('launch');
    await library.getByRole('button', { name: 'Roast this hook' }).click();
    await page.locator('button[type="submit"]').click();
    await cards
      .first()
      .getByRole('button', { name: 'Save hook', exact: true })
      .click();
    await page.getByRole('button', { name: /Open saved hooks \(4\)/ }).click();
    await library.getByRole('searchbox').fill('Rewritten');
    await library
      .getByRole('button', { name: 'Remove from saved hooks' })
      .click();
    await library.getByText('No hooks match these filters.').waitFor();
    await page.keyboard.press('Escape');
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `Passed saved hooks, copy, PNG, CSV, filters, compare, roast, outline and persistence at ${width}px.`,
    );
  }
  const context = await browser.newContext();
  const response = await context.request.post(`${baseURL}/api/expand-hook`, {
    data: {},
  });
  assert.equal(
    response.status(),
    400,
    'Local expansion route must exist and validate input',
  );
  await context.close();
  console.log(`Screenshots and exports: ${output}`);
} finally {
  await browser.close();
}
