import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { demonstrations } from '../public/js/registry.js';
import { browserFixture } from './dom-fixture.js';
setMaxListeners(0);
const hasClass = name => node => node.className.split(' ').includes(name);
function descendants(node, predicate) {
  return [ ...(predicate(node) ? [node] : []), ...node.children.flatMap(child => descendants(child, predicate)) ];
}
for (const entry of demonstrations) {
  test(`${entry.id}: graphs follow playback, parameter changes, language, and visibility`, async () => {
    const fixture = browserFixture(); let demo;
    try {
      demo = (await entry.load()).mount({ root: fixture.root, lang: 'en' });
      const root = fixture.find(hasClass('motion-graphs'));
      const stage = fixture.find(hasClass('stage'));
      assert.equal(root.parentNode, stage);
      const control = fixture.find(hasClass('graph-controls'));
      const toggle = descendants(control, node => node.type === 'checkbox')[0];
      assert.equal(root.hidden, true);
      toggle.checked = true; toggle.dispatchEvent(new Event('change'));
      assert.equal(root.hidden, false);
      assert.match(stage.className, /has-graphs/);
      const legends = descendants(root, hasClass('graph-legend'));
      assert.equal(legends.length, entry.id === 'basketball' ? 1 : 0);
      for (const legend of legends) {
        assert.match(legend.textContent, /Horizontal motion \(x\) · solid/);
        assert.match(legend.textContent, /Vertical motion \(y\) · dashed/);
      }
      const charts = descendants(root, node => node.tagName === 'svg');
      assert.equal(charts.length, 3);
      const labels = descendants(root, node => node.tagName === 'math');
      assert.equal(labels.length, 3);
      assert.equal(labels[0].getAttribute('aria-label'), entry.id === 'pendulum' ? 'θ(t) [rad]' : 'x(t) [m]');
      assert.ok(descendants(labels[2], node => node.tagName === 'msup').length);
      assert.equal(descendants(root, node => node.tagName === 'tspan' && node.textContent === ' [s]').length, 3);
      const curves = descendants(root, node => (node.getAttribute('class') ?? '').includes('graph-curve'));
      assert.equal(curves.length, entry.id === 'basketball' ? 6 : 3);
      for (const curve of curves) assert.doesNotMatch(curve.getAttribute('d'), /NaN|Infinity/);
      const cursor = descendants(root, node => node.getAttribute('class') === 'graph-cursor')[0];
      const initialCursor = cursor.getAttribute('d');
      const step = fixture.find(node => node.tagName === 'button' && node.textContent === 'Step');
      step.dispatchEvent(new Event('click'));
      assert.notEqual(cursor.getAttribute('d'), initialCursor);
      const layout = descendants(control, node => node.tagName === 'select')[0];
      layout.value = 'beside'; layout.dispatchEvent(new Event('change'));
      assert.match(fixture.find(hasClass('graph-grid')).className, /is-beside/);
      assert.match(stage.className, /graphs-beside/);
      const before = fixture.find(hasClass('graph-value')).textContent;
      demo.setLanguage('he');
      assert.match(control.textContent, /הצגת גרפי תנועה/);
      assert.match(fixture.find(hasClass('graph-value')).textContent, /0\.05/);
      assert.notEqual(fixture.find(hasClass('graph-value')).textContent, before);
      const parameter = fixture.find(node => node.type === 'number');
      parameter.value = entry.id === 'basketball' ? '7.2' : '15'; parameter.dispatchEvent(new Event('change'));
      assert.match(fixture.find(hasClass('graph-value')).textContent, /0\.00/);
      toggle.checked = false; toggle.dispatchEvent(new Event('change')); assert.equal(root.hidden, true);
      assert.doesNotMatch(stage.className, /has-graphs/);
      demo.dispose(); demo = null; assert.equal(fixture.root.children.length, 0);
    } finally { demo?.dispose(); fixture.cleanup(); }
  });
}
