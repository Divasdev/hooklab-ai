import assert from 'node:assert/strict';
import { cp, mkdtemp, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

// Vercel compiles each serverless file on its own and runs it as native ESM,
// so every relative import needs a .js extension. Vite and tsc don't catch a
// missing one; this check loads each function the way production does.
const root = resolve('.');
const work = await mkdtemp(join(tmpdir(), 'hooklab-functions-'));

const listTs = async (dir) =>
  (await readdir(join(root, dir), { recursive: true }))
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts'))
    .map((file) => join(dir, file));

try {
  await cp(join(root, 'package.json'), join(work, 'package.json'));
  await symlink(join(root, 'node_modules'), join(work, 'node_modules'), 'dir');
  const files = (
    await Promise.all(
      ['api', 'src/server', 'src/utils', 'src/types'].map(listTs),
    )
  ).flat();
  await build({
    entryPoints: files.map((file) => join(root, file)),
    outdir: work,
    outbase: root,
    format: 'esm',
    platform: 'node',
    bundle: false,
    logLevel: 'error',
  });

  const functions = (await readdir(join(root, 'api'))).filter((file) =>
    file.endsWith('.ts'),
  );
  for (const file of functions) {
    const url = pathToFileURL(join(work, 'api', file.replace(/\.ts$/, '.js')));
    const module = await import(url.href).catch((error) => {
      assert.fail(`api/${file} fails to load in production: ${error.message}`);
    });
    assert.equal(
      typeof module.default,
      'function',
      `api/${file} default export`,
    );
  }
  console.log(
    `All ${functions.length} serverless functions load as native ESM.`,
  );
} finally {
  await rm(work, { recursive: true, force: true });
}
