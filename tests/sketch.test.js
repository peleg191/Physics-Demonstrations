import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { readFile } from 'node:fs/promises';
import { browserFixture } from './dom-fixture.js';
import { pencilPath, addSketchOutlines } from '../public/js/core/sketch.js';
import { demonstrations } from '../public/js/registry.js';
setMaxListeners(0);
function outlines(node) {
  return [...(node.getAttribute('class') === 'pencil-outline' ? [node] : []), ...node.children.flatMap(outlines)];
}

test('pencil geometry is deterministic and preserves its endpoints', () => {
  const points = [[10, 20], [15, 25], [20, 30]];
  const path = pencilPath(points);
  assert.equal(path, pencilPath(points));
  assert.match(path, /^M 10.00 20.00 /);
  assert.match(path, /L 20.00 30.00$/);
  assert.notEqual(path, 'M 10.00 20.00 L 15.00 25.00 L 20.00 30.00');
});
for (const entry of demonstrations) {
  test(`${entry.id}: notebook outlines are reused during playback and original mode adds none`, async () => {
    const fixture = browserFixture(); let demo;
    try {
      fixture.document.documentElement = { dataset: { illustrationStyle: 'notebook' } };
      const module = await entry.load();
      demo = module.mount({ root: fixture.root, lang: 'en' });
      const initial = outlines(fixture.root);
      assert.ok(initial.length > 0);
      if (entry.id === 'basketball') {
        const ball = fixture.find(node => node.getAttribute('class') === 'selectable-ball');
        assert.equal(ball.children.filter(node => node.getAttribute('class') === 'pencil-outline').length, 0, 'selection ring must not acquire a permanently visible sketch outline');
      }
      const paths = initial.map(node => node.getAttribute('d'));
      const svg = fixture.find(node => node.getAttribute('class') === 'system-svg');
      addSketchOutlines(svg);
      assert.deepEqual(outlines(fixture.root), initial, 'repeated setup must not accumulate outlines');
      const play = fixture.find(node => node.tagName === 'button' && node.textContent === 'Play');
      play.dispatchEvent(new Event('click')); fixture.frame(0); fixture.frame(100); fixture.frame(200);
      assert.deepEqual(outlines(fixture.root), initial);
      assert.deepEqual(initial.map(node => node.getAttribute('d')), paths);
      for (const outline of initial) {
        assert.equal(outline.getAttribute('pointer-events'), 'none');
        assert.equal(outline.getAttribute('filter'), null);
        assert.doesNotMatch(outline.getAttribute('d'), /NaN|Infinity/);
      }
      demo.reset(); demo.setLanguage('he');
      const parameter = fixture.find(node => node.type === 'number');
      parameter.value = '10'; parameter.dispatchEvent(new Event('change'));
      assert.ok(outlines(fixture.root).length > 0);
      demo.dispose(); demo = null;
      fixture.document.documentElement.dataset.illustrationStyle = 'current';
      demo = module.mount({ root: fixture.root, lang: 'en' });
      assert.equal(outlines(fixture.root).length, 0);
      const currentSvg = fixture.find(node => node.getAttribute('class') === 'system-svg');
      const currentPlay = fixture.find(node => node.tagName === 'button' && node.textContent === 'Play');
      currentPlay.dispatchEvent(new Event('click')); fixture.frame(0); fixture.frame(200);
      const currentTime = fixture.find(node => node.className === 'metric-value').textContent;
      fixture.document.documentElement.dataset.illustrationStyle = 'notebook';
      addSketchOutlines(currentSvg);
      const switchedOutlines = outlines(fixture.root);
      assert.ok(switchedOutlines.length > 0);
      assert.equal(fixture.find(node => node.className === 'metric-value').textContent, currentTime);
      assert.equal(fixture.frames.size, 1, 'switching style must preserve playback');
      fixture.document.documentElement.dataset.illustrationStyle = 'current';
      fixture.document.documentElement.dataset.illustrationStyle = 'notebook';
      addSketchOutlines(currentSvg);
      assert.deepEqual(outlines(fixture.root), switchedOutlines);
      fixture.frame(400);
      assert.deepEqual(outlines(fixture.root), switchedOutlines);
    } finally { demo?.dispose(); fixture.cleanup(); }
  });
}
test('notebook assets and stylesheet contain no live pencil filters', async () => {
  const paths = ['public/index.html', 'public/styles/notebook.css', ...demonstrations.map(entry => `public/assets/notebook/${entry.id}.svg`)];
  for (const path of paths) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /feTurbulence|feDisplacementMap|filter\s*[:=]/i, path);
  }
});
