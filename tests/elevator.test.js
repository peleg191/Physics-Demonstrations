import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { elevatorState, defaultParameters, duration } from '../public/js/demos/elevator/physics.js';
import { mount } from '../public/js/demos/elevator/index.js';
import { browserFixture } from './dom-fixture.js';
setMaxListeners(0);
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test('elevator force balance, free fall, signed kinematics, mass scaling and observation cutoff', () => {
  near(elevatorState(defaultParameters, 1, 10).normal, 720);
  for (const g of [3.7, 9.81, 10, 20]) for (const mass of [15, 60, 150]) {
    for (const acceleration of [-g, -g / 2, 0, 2, g]) {
      const p = { mass, acceleration }, state = elevatorState(p, 2, g);
      near(state.normal - state.weight, mass * acceleration);
      near(state.netForce, mass * acceleration);
      near(state.position, 2 * acceleration); near(state.velocity, 2 * acceleration);
      assert.ok(state.normal >= 0);
      near(elevatorState({ ...p, mass: mass * 2 }, 2, g).normal, state.normal * 2);
      near(elevatorState(p, 100, g).position, 0.5 * acceleration * duration ** 2);
    }
    near(elevatorState({ mass, acceleration: -g }, 1, g).normal, 0);
    near(elevatorState({ mass, acceleration: -2 * g }, 1, g).normal, 0);
  }
});
test('elevator inspection pauses, retains expansions across edits and translations, resumes and closes accessibly', () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = mount({ root: fixture.root, lang: 'en' });
    const find = fixture.find, svg = find(n => n.getAttribute('class') === 'system-svg');
    const person = find(n => n.getAttribute('class') === 'selectable-mass');
    const panel = find(n => n.id === 'elevator-analysis');
    const play = find(n => n.tagName === 'button' && n.textContent === 'Play');
    play.dispatchEvent(new Event('click')); fixture.frame(0); fixture.frame(500);
    const key = new Event('keydown', { cancelable: true });
    Object.defineProperties(key, { target: { value: person }, key: { value: 'Enter' } }); svg.dispatchEvent(key);
    assert.equal(panel.hidden, false); assert.equal(fixture.frames.size, 0);
    assert.match(panel.textContent, /N−mg=ma/);
    const expansions = panel.children.filter(n => n.tagName === 'details');
    expansions.forEach(n => { n.open = true; });
    const input = find(n => n.id === 'elevator-acceleration');
    for (const [value, normal] of [[-5, 300], [0, 600], [2, 720], [-10, 0]]) {
      input.value = String(value); input.dispatchEvent(new Event('change'));
      assert.equal(person.getAttribute('aria-pressed'), 'true');
      assert.match(person.getAttribute('aria-label'), new RegExp(`N = ${normal}`));
      assert.ok(expansions.every(n => n.open));
      assert.doesNotMatch(svg.textContent, /NaN|Infinity/);
    }
    assert.match(fixture.root.textContent, /Free fall/);
    demo.setLanguage('he'); assert.match(panel.textContent, /הכוחות הפועלים על האדם/);
    assert.ok(expansions.every(n => n.open));
    demo.setLanguage('en'); play.dispatchEvent(new Event('click')); assert.equal(fixture.frames.size, 1);
    assert.equal(panel.hidden, false);
    const escape = new Event('keydown', { cancelable: true }); Object.defineProperty(escape, 'key', { value: 'Escape' });
    fixture.root.dispatchEvent(escape); assert.equal(panel.hidden, true); assert.equal(fixture.document.activeElement, person);
    demo.dispose(); demo = null; assert.equal(fixture.frames.size, 0); assert.equal(fixture.root.children.length, 0);
  } finally { demo?.dispose(); fixture.cleanup(); }
});
