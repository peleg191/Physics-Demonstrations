import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
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
  }
});
