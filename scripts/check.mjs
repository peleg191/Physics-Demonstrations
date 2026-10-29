import { readdir, readFile, lstat } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const project = fileURLToPath(new URL('../', import.meta.url));
const root = resolve(project, 'public');
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if ((await lstat(path)).isSymbolicLink()) throw new Error(`Public symlink is not allowed: ${path}`);
    if (entry.isDirectory()) await walk(path); else files.push(path);
  }
}
await walk(root);
for (const path of files) {
  if (/\.(?:otf|ttf|woff2?)$/i.test(path)) continue; // Font bytes are not source text.
  const text = await readFile(path, 'utf8');
  if (/\.pdf$/i.test(path) || /tirgul|recitation|homework|\.pdf\b/i.test(text)) throw new Error(`Private material reference: ${path}`);
  if (/\.js$/.test(path)) {
    const check = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
    if (check.status !== 0) throw new Error(check.stderr);
  }
  const refs = path.endsWith('.js')
    ? [...text.matchAll(/(?:from\s*|import\s*\()(['"])(\.\.?\/[^'"]+)\1/g)].map(m => m[2])
    : path.endsWith('.html') ? [...text.matchAll(/(?:src|href)="(\.\.?\/[^"#]+)"/g)].map(m => m[1])
    : path.endsWith('.css') ? [...text.matchAll(/url\(['"]?(\.\.?\/[^)'"]+)['"]?\)/g)].map(m => m[1]) : [];
  for (const ref of refs) {
    const target = resolve(dirname(path), ref);
    if (relative(root, target).startsWith('..')) throw new Error(`Asset outside public directory: ${ref}`);
    if (!(await lstat(target)).isFile()) throw new Error(`Missing asset ${target}`);
  }
}
const { demonstrations } = await import('../public/js/registry.js');
const ids = new Set();
for (const entry of demonstrations) {
  if (ids.has(entry.id) || !/^[a-z0-9-]+$/.test(entry.id)) throw new Error('Invalid or repeated registry ID');
  ids.add(entry.id);
  for (const lang of ['en', 'he']) {
    if (!entry.title[lang] || !entry.description[lang] || !entry.tags[lang]?.length) throw new Error(`Missing ${lang} metadata`);
  }
  const image = resolve(root, entry.illustration);
  if (!(await lstat(image)).isFile()) throw new Error(`Missing illustration ${image}`);
  const demo = await entry.load();
  if (typeof demo.mount !== 'function') throw new Error(`Missing mount: ${entry.id}`);
}
console.log(`Checked ${files.length} public files: syntax, module imports, assets, registry, and deployment isolation.`);
