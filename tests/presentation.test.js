import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { presentationConfig } from '../public/js/config.js';
import { resolveIllustrationStyle, illustrationSource } from '../public/js/core/presentation.js';
import { demonstrations } from '../public/js/registry.js';

test('the original design stays the default and notebook is an explicit preview or configuration', () => {
  assert.ok(['current', 'notebook'].includes(presentationConfig.illustrationStyle));
  assert.equal(resolveIllustrationStyle(''), presentationConfig.illustrationStyle);
  assert.equal(resolveIllustrationStyle('', 'current'), 'current');
  assert.equal(resolveIllustrationStyle('?style=notebook'), 'notebook');
  assert.equal(resolveIllustrationStyle('', 'notebook'), 'notebook');
  assert.equal(resolveIllustrationStyle('?style=current', 'notebook'), 'current');
  assert.equal(resolveIllustrationStyle('?style=unknown'), 'current');
});
test('each catalog illustration has a separate notebook asset while its original path remains intact', async () => {
  for (const entry of demonstrations) {
    const original = illustrationSource(entry.illustration, 'current');
    const sketch = illustrationSource(entry.illustration, 'notebook');
    assert.equal(original, entry.illustration);
    assert.notEqual(sketch, original);
    await Promise.all([access(new URL(`../public/${original}`, import.meta.url)), access(new URL(`../public/${sketch}`, import.meta.url))]);
    const [originalArt, notebookArt] = await Promise.all([
      readFile(new URL(`../public/${original}`, import.meta.url), 'utf8'),
      readFile(new URL(`../public/${sketch}`, import.meta.url), 'utf8'),
    ]);
    assert.notEqual(notebookArt, originalArt, `${entry.id}: notebook artwork must have its own treatment`);
    assert.match(notebookArt, /stroke-width="\.85"/, `${entry.id}: expected pencil outlines`);
  }
});

test('all catalog illustrations have theme-specific assets with unchanged geometry in both styles', async () => {
  const geometry = svg => [...svg.matchAll(/\s(viewBox|d|x|y|cx|cy|r|rx|ry|width|height|transform|opacity|fill-opacity)="([^"]*)"/g)].map(match => match.slice(1));
  for (const entry of demonstrations) for (const style of ['current', 'notebook']) {
    const light = illustrationSource(entry.illustration, style, 'light');
    const dark = illustrationSource(entry.illustration, style, 'dark');
    assert.equal(illustrationSource(entry.illustration, style), light);
    assert.notEqual(dark, light);
    assert.match(dark, style === 'notebook' ? /notebook\/dark\/[^/]+\.svg$/ : /assets\/dark\/[^/]+\.svg$/);
    const [lightArt, darkArt] = await Promise.all([light, dark].map(path => readFile(new URL(`../public/${path}`, import.meta.url), 'utf8')));
    assert.notEqual(darkArt, lightArt, `${entry.id}: dark artwork needs its own palette`);
    assert.deepEqual(geometry(darkArt), geometry(lightArt), `${entry.id}: theming preserves illustration geometry`);
  }
});
