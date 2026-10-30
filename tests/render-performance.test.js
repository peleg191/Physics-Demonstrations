import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { browserFixture } from './dom-fixture.js';
import { demonstrations } from '../public/js/registry.js';
import { createBodyAnalysis } from '../public/js/core/body-analysis.js';
setMaxListeners(0);
const hasClass = name => node => node.className.split(' ').includes(name);
for (const entry of demonstrations) {
  test(`${entry.id}: animation reuses DOM and pause flushes exact readouts`, async () => {
    const fixture = browserFixture(); let demo;
    try {
      demo = (await entry.load()).mount({ root: fixture.root, lang: 'en' });
      const play = fixture.find(node => node.tagName === 'button' && node.textContent === 'Play');
      const time = fixture.find(hasClass('metric-value'));
      play.dispatchEvent(new Event('click')); fixture.frame(0);
      const icon = play.children[0];
      let created = 0;
      for (const key of ['createElement', 'createElementNS']) {
        const original = fixture.document[key];
        fixture.document[key] = (...args) => { created++; return original(...args); };
      }
      fixture.frame(16); fixture.frame(32);
      assert.equal(time.textContent, '0.00s', 'readouts should not be rewritten every animation frame');
      assert.equal(play.children[0], icon);
      assert.equal(created, 0, 'ordinary animation must not allocate new DOM nodes');
      play.dispatchEvent(new Event('click'));
      assert.equal(time.textContent, '0.03s', 'pause must show the exact current time immediately');
      assert.equal(fixture.frames.size, 0);
    } finally { demo?.dispose(); fixture.cleanup(); }
  });
}
test('basketball reveals a cached trajectory while the ball continues moving each frame', async () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = (await demonstrations.find(entry => entry.id === 'basketball').load()).mount({ root: fixture.root, lang: 'en' });
    const path = fixture.find(node => node.getAttribute('class') === 'shot-trajectory');
    const clip = fixture.find(node => node.id === 'shot-progress' || node.getAttribute('id') === 'shot-progress').children[0];
    const ball = fixture.find(node => node.getAttribute('class') === 'selectable-ball');
    const data = path.getAttribute('d');
    let pathWrites = 0;
    const setAttribute = path.setAttribute.bind(path);
    path.setAttribute = (key, value) => { if (key === 'd') pathWrites++; setAttribute(key, value); };
    fixture.find(node => node.tagName === 'button' && node.textContent === 'Play').dispatchEvent(new Event('click'));
    fixture.frame(0); fixture.frame(16);
    const position = ball.getAttribute('transform'), width = Number(clip.getAttribute('width'));
    fixture.frame(32);
    assert.notEqual(ball.getAttribute('transform'), position);
    assert.ok(Number(clip.getAttribute('width')) > width);
    assert.equal(pathWrites, 0); assert.equal(path.getAttribute('d'), data);
    demo.reset(); assert.equal(Number(clip.getAttribute('width')), 65);
    const angle = fixture.find(node => node.id === 'basketball-angle'); angle.value = '60'; angle.dispatchEvent(new Event('change'));
    assert.notEqual(fixture.find(node => node.getAttribute('class') === 'shot-trajectory').getAttribute('d'), data);
  } finally { demo?.dispose(); fixture.cleanup(); }
});
test('analysis notice and numeric changes preserve static equations and derivations', () => {
  const fixture = browserFixture();
  try {
    const panel = createBodyAnalysis({ parent: fixture.root, signal: new AbortController().signal, onClose() {}, id: 'performance-analysis' });
    const data = { title: 'Forces', close: 'Close', notice: '', axis: 'Up', cutoff: '',
      equations: [{ math: true, text: 'F = ma' }], numeric: [{ math: true, text: 'F = 2' }], solution: [{ math: true, text: 'a = F / m' }] };
    panel.update(data);
    const equation = panel.root.children[3].children[0];
    const [numeric, solution] = panel.root.children.filter(node => node.tagName === 'details');
    solution.open = true;
    const derivation = solution.children[1].children[0];
    const oldNumeric = numeric.children[1].children[0];
    panel.update({ ...data, notice: 'Paused', numeric: [{ math: true, text: 'F = 3' }] });
    assert.equal(panel.root.children[3].children[0], equation);
    assert.equal(solution.children[1].children[0], derivation);
    assert.notEqual(numeric.children[1].children[0], oldNumeric);
    assert.equal(solution.open, true);
  } finally { fixture.cleanup(); }
});
