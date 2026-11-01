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
      assert.equal(descendants(root, node => node.tagName === 'h3').length, 0);
      for (const label of labels) {
        assert.equal(label.parentNode.parentNode.tagName, 'foreignObject');
        assert.equal(label.parentNode.parentNode.parentNode.tagName, 'svg');
      }
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
      const tabs = descendants(root, hasClass('graph-tab'));
      const cards = descendants(root, hasClass('graph-card'));
      assert.equal(tabs.length, 3);
      assert.equal(cards.filter(card => !card.hidden).length, 1);
      tabs[1].dispatchEvent(new Event('click'));
      assert.equal(cards[1].hidden, false);
      assert.equal(cards[0].hidden, false);
      assert.equal(tabs[1].getAttribute('aria-pressed'), 'true');
      tabs[2].dispatchEvent(new Event('click'));
      assert.equal(cards.filter(card => !card.hidden).length, 3);
      tabs[0].dispatchEvent(new Event('click'));
      assert.equal(cards[0].hidden, true);
      assert.equal(cards[1].hidden, false);
      assert.equal(cards[2].hidden, false);
      assert.equal(tabs[0].getAttribute('aria-pressed'), 'false');
      assert.equal(fixture.find(hasClass('graph-value')), undefined);
      demo.setLanguage('he');
      assert.match(control.textContent, /הצגת גרפי תנועה/);
      assert.deepEqual(descendants(root, hasClass('graph-card')).map(card => card.hidden), [true, false, false]);
      assert.equal(descendants(root, node => node.getAttribute('class') === 'graph-cursor')[0].getAttribute('d'), cursor.getAttribute('d'));
      const parameter = fixture.find(node => node.type === 'number');
      parameter.value = entry.id === 'basketball' ? '7.2' : '15'; parameter.dispatchEvent(new Event('change'));
      assert.equal(descendants(root, node => node.getAttribute('class') === 'graph-cursor')[0].getAttribute('d'), initialCursor);
      assert.deepEqual(descendants(root, hasClass('graph-card')).map(card => card.hidden), [true, false, false]);
      toggle.checked = false; toggle.dispatchEvent(new Event('change')); assert.equal(root.hidden, true);
      assert.doesNotMatch(stage.className, /has-graphs/);
      toggle.checked = true; toggle.dispatchEvent(new Event('change'));
      assert.deepEqual(descendants(root, hasClass('graph-card')).map(card => card.hidden), [true, false, false]);
      const currentTabs = descendants(root, hasClass('graph-tab'));
      currentTabs[1].dispatchEvent(new Event('click'));
      currentTabs[2].dispatchEvent(new Event('click'));
      assert.ok(descendants(root, hasClass('graph-card')).every(card => card.hidden));
      currentTabs[0].dispatchEvent(new Event('click'));
      assert.deepEqual(descendants(root, hasClass('graph-card')).map(card => card.hidden), [false, true, true]);
      demo.dispose(); demo = null; assert.equal(fixture.root.children.length, 0);
    } finally { demo?.dispose(); fixture.cleanup(); }
  });
}

test('graph window switches layout after selection and manual resizing without overriding user size', async () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = (await demonstrations[0].load()).mount({ root: fixture.root, lang: 'en' });
    const stage = fixture.find(hasClass('stage')), root = fixture.find(hasClass('motion-graphs'));
    stage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 500 });
    root.getBoundingClientRect = () => Object.fromEntries(['left', 'top', 'width', 'height'].map(key => [key, parseFloat(root.style[key]) || 0]));
    Object.defineProperty(root, 'clientWidth', { get: () => parseFloat(root.style.width) || 0 });
    const checkbox = descendants(fixture.find(hasClass('graph-controls')), node => node.type === 'checkbox')[0];
    checkbox.checked = true; checkbox.dispatchEvent(new Event('change'));
    const tabs = descendants(root, hasClass('graph-tab')), grid = fixture.find(hasClass('graph-grid'));
    assert.equal(hasClass('is-horizontal')(grid), false);
    const resize = fixture.find(hasClass('graph-window-resize'));
    root.style.width = '800px';
    const widen = new Event('keydown', { cancelable: true }); Object.defineProperty(widen, 'key', { value: 'ArrowRight' });
    resize.dispatchEvent(widen);
    tabs[1].dispatchEvent(new Event('click'));
    assert.equal(hasClass('is-horizontal')(grid), true);
    tabs[2].dispatchEvent(new Event('click'));
    assert.equal(hasClass('is-horizontal')(grid), true);
    root.style.width = '500px';
    const key = new Event('keydown', { cancelable: true }); Object.defineProperty(key, 'key', { value: 'ArrowLeft' });
    resize.dispatchEvent(key);
    assert.equal(root.style.width, '490px');
    assert.equal(hasClass('is-horizontal')(grid), false);
    tabs[2].dispatchEvent(new Event('click'));
    assert.equal(root.style.width, '490px');
    assert.equal(hasClass('is-horizontal')(grid), true);
  } finally { demo?.dispose(); fixture.cleanup(); }
});

test('switching simulations starts fresh graph geometry after moving and resizing the previous window', async () => {
  const fixture = browserFixture(); let demo;
  const defaults = new Map();
  try {
    // Revisit each simulation as well as switching to different simulations.
    for (const entry of [...demonstrations, ...demonstrations]) {
      demo = (await entry.load()).mount({ root: fixture.root, lang: 'en' });
      const stage = fixture.find(hasClass('stage')), root = fixture.find(hasClass('motion-graphs'));
      stage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 500 });
      root.getBoundingClientRect = () => Object.fromEntries(['left', 'top', 'width', 'height'].map(key => [key, parseFloat(root.style[key]) || 0]));
      Object.defineProperty(root, 'clientWidth', { get: () => parseFloat(root.style.width) || 0 });
      const checkbox = descendants(fixture.find(hasClass('graph-controls')), node => node.type === 'checkbox')[0];
      checkbox.checked = true; checkbox.dispatchEvent(new Event('change'));
      const initial = root.getBoundingClientRect();
      if (defaults.has(entry.id)) assert.deepEqual(initial, defaults.get(entry.id));
      else defaults.set(entry.id, initial);
      const key = () => { const event = new Event('keydown', { cancelable: true }); Object.defineProperty(event, 'key', { value: 'ArrowRight' }); return event; };
      fixture.find(hasClass('graph-window-move')).dispatchEvent(key());
      fixture.find(hasClass('graph-window-resize')).dispatchEvent(key());
      const changed = root.getBoundingClientRect();
      assert.notEqual(changed.left, initial.left);
      assert.notEqual(changed.width, initial.width);
      // Ordinary use within this simulation keeps the manual geometry.
      demo.setLanguage('he');
      assert.deepEqual(root.getBoundingClientRect(), changed);
      demo.dispose(); demo = null;
      for (const property of ['left', 'top', 'right', 'bottom', 'width', 'height']) assert.equal(root.style[property], '');
      assert.equal(fixture.root.children.length, 0);
    }
  } finally { demo?.dispose(); fixture.cleanup(); }
});
