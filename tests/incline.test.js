import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { defaultParameters, inclineForces, inclineState, travelDuration, travelLength } from '../public/js/demos/incline/physics.js';
import { mount } from '../public/js/demos/incline/index.js';
import { browserFixture } from './dom-fixture.js';
setMaxListeners(0);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
test('incline reproduces exercise values and threshold, balances forces, and conserves work-energy', () => {
  const p = defaultParameters, f = inclineForces(p, 10);
  close(f.criticalAngle, Math.atan(0.2) * 180 / Math.PI);
  close(f.acceleration, 10 * (0.5 - 0.1 * Math.cos(Math.PI / 6)));
  assert.equal(f.resting, false);
  for (const gravity of [3.7, 10, 20]) for (const mass of [1, 3, 30]) {
    const params = { ...p, mass }, state = inclineState(params, 0.5, gravity);
    close(state.acceleration, inclineForces(p, gravity).acceleration);
    close(state.downhill - state.friction, mass * state.acceleration);
    close(0.5 * mass * state.velocity ** 2, (state.downhill - state.friction) * state.displacement);
    close(inclineState(params, travelDuration(params, gravity) + 10, gravity).displacement, travelLength);
  }
  for (const angle of [0, 5, f.criticalAngle]) {
    const state = inclineState({ ...p, angle }, 2, 10);
    assert.equal(state.resting, true); close(state.friction, state.downhill); close(state.displacement, 0);
  }
  assert.equal(inclineForces({ ...p, angle: f.criticalAngle + 0.001 }, 10).resting, false);
  close(inclineForces({ ...p, staticFriction: 0, kineticFriction: 0 }, 10).acceleration, 5);
});
test('incline selection, coefficient constraints, rest, localization and disposal', () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = mount({ root: fixture.root, lang: 'en' });
    const find = fixture.find;
    const svg = find(n => n.tagName === 'svg');
    const block = () => find(n => n.getAttribute('class') === 'selectable-mass');
    const panel = find(n => n.id === 'incline-analysis');
    const select = () => { const event = new Event('click'); Object.defineProperty(event, 'target', { value: block() }); svg.dispatchEvent(event); };
    const edit = (key, value) => { const input = find(n => n.id === `incline-${key}`); input.value = value; input.dispatchEvent(new Event('change')); };
    const play = find(n => n.tagName === 'button' && n.textContent === 'Play');
    play.dispatchEvent(new Event('click')); fixture.frame(0); fixture.frame(500);
    select(); assert.equal(panel.hidden, false); assert.equal(fixture.frames.size, 0);
    assert.match(panel.textContent, /kinetic friction/);
    edit('angle', '5'); assert.match(panel.textContent, /Static friction/);
    assert.equal(block().getAttribute('aria-pressed'), 'true');
    edit('staticFriction', '0.05'); assert.equal(find(n => n.id === 'incline-kineticFriction').value, '0.05');
    edit('kineticFriction', '0.4'); assert.equal(find(n => n.id === 'incline-staticFriction').value, '0.4');
    demo.setLanguage('he'); assert.match(panel.textContent, /הכוחות הפועלים/);
    const escape = new Event('keydown', { cancelable: true }); Object.defineProperty(escape, 'key', { value: 'Escape' }); fixture.root.dispatchEvent(escape);
    assert.equal(panel.hidden, true); assert.equal(fixture.document.activeElement, block());
    demo.setLanguage('en');
    find(n => n.tagName === 'button' && n.textContent === 'Restore defaults').dispatchEvent(new Event('click'));
    assert.equal(find(n => n.id === 'incline-mass').value, '3');
    demo.dispose(); demo = null; assert.equal(fixture.root.children.length, 0); assert.equal(fixture.frames.size, 0);
  } finally { demo?.dispose(); fixture.cleanup(); }
});

test('incline angle persists during playback and resolved arrows reconstruct weight along slope axes', () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = mount({ root: fixture.root, lang: 'en' });
    const find = fixture.find;
    const toggle = find(node => node.id === 'incline-resolve-forces');
    toggle.checked = true; toggle.dispatchEvent(new Event('change'));
    for (const angle of [0, 30, 60]) {
      const input = find(node => node.id === 'incline-angle');
      input.value = String(angle); input.dispatchEvent(new Event('change'));
      const angleMarker = find(node => node.getAttribute('class') === 'incline-angle');
      assert.match(angleMarker.textContent, new RegExp(`θ = ${angle}`));
      const parallelLabel = find(node => node.textContent.startsWith('mg sin θ =') && node.tagName === 'text');
      const forceGroup = parallelLabel.parentNode;
      assert.equal(forceGroup.getAttribute('display'), 'inline');
      const paths = forceGroup.children.filter(node => node.tagName === 'path' && node.getAttribute('display') === 'inline');
      assert.equal(paths.length, 4);
      const vector = path => path.getAttribute('d').match(/ l ([^ ]+) ([^ ]+)/).slice(1).map(Number);
      const [parallel, normal, friction, perpendicular] = paths.map(vector);
      close(parallel[0] + perpendicular[0], 0);
      close(parallel[1] + perpendicular[1], 60);
      close(normal[0] + perpendicular[0], 0);
      close(normal[1] + perpendicular[1], 0);
      const alpha = angle * Math.PI / 180;
      close(parallel[0] * Math.sin(alpha) - parallel[1] * Math.cos(alpha), 0);
      close(friction[0] * Math.sin(alpha) - friction[1] * Math.cos(alpha), 0);
      assert.doesNotMatch(forceGroup.textContent, /NaN|Infinity/);
    }
    find(node => node.tagName === 'button' && node.textContent === 'Play').dispatchEvent(new Event('click'));
    fixture.frame(0); fixture.frame(100);
    assert.notEqual(find(node => node.getAttribute('class') === 'incline-angle').getAttribute('display'), 'none');
    demo.setLanguage('he');
    assert.match(toggle.parentNode.textContent, /פירוק הכוחות/);
    toggle.checked = false; toggle.dispatchEvent(new Event('change'));
    const axes = find(node => node.getAttribute('class') === 'incline-force-axes');
    assert.equal(axes.parentNode.getAttribute('display'), 'none');
  } finally { demo?.dispose(); fixture.cleanup(); }
});
