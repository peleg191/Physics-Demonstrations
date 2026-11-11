import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import * as pendulum from '../public/js/demos/pendulum/physics.js';
import * as spring from '../public/js/demos/spring/physics.js';
import { demonstrations } from '../public/js/registry.js';
import { browserFixture } from './dom-fixture.js';
setMaxListeners(0);
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
for (const [name, model] of [['pendulum', pendulum], ['spring', spring]]) {
  test(`${name}: initial conditions, phase, restoring acceleration, energy and period`, () => {
    for (const mass of [1, 2, 30]) for (const gravity of [3.7, 10, 20]) {
      const params = { ...model.defaultParameters, mass }, initial = model.oscillatorState(params, 0, gravity);
      const amplitude = name === 'pendulum' ? params.amplitude * Math.PI / 180 : params.amplitude;
      near(initial.position, amplitude); near(initial.velocity, 0);
      const quarter = model.oscillatorState(params, initial.period / 4, gravity);
      near(quarter.position, 0); near(quarter.velocity, -amplitude * initial.omega);
      const half = model.oscillatorState(params, initial.period / 2, gravity);
      near(half.position, -amplitude); near(half.velocity, 0);
      for (const fraction of [0.13, 0.25, 0.5, 0.81, 1]) {
        const state = model.oscillatorState(params, initial.period * fraction, gravity);
        near(state.acceleration, -(initial.omega ** 2) * state.position);
        near(state.kinetic + state.potential, initial.kinetic + initial.potential);
      }
      near(model.duration(params, gravity), 4 * initial.period);
      const changed = { ...params, mass: mass * 4 };
      near(model.oscillatorState(changed, 0, gravity).period, initial.period * (name === 'pendulum' ? 1 : 2));
      near(model.oscillatorState({ ...params, amplitude: params.amplitude / 2 }, 0, gravity).period, initial.period);
    }
  });
  test(`${name}: selection pauses, equations localize, edits preserve expansion, observation ends cleanly`, async () => {
    const fixture = browserFixture(); let demo;
    try {
      demo = (await demonstrations.find(entry => entry.id === name).load()).mount({ root: fixture.root, lang: 'en' });
      const find = fixture.find, svg = find(n => n.tagName === 'svg');
      const body = find(n => n.getAttribute('class') === 'selectable-mass');
      const panel = find(n => n.id === `${name}-analysis`);
      const play = find(n => n.tagName === 'button' && n.textContent === 'Play');
      play.dispatchEvent(new Event('click')); fixture.frame(0); fixture.frame(500);
      const click = new Event('click'); Object.defineProperty(click, 'target', { value: body.children[0] }); svg.dispatchEvent(click);
      assert.equal(panel.hidden, false); assert.equal(fixture.frames.size, 0);
      assert.equal(body.getAttribute('aria-pressed'), 'true');
      const solution = panel.children.filter(n => n.tagName === 'details').at(-1); solution.open = true;
      const input = find(n => n.id === `${name}-amplitude`); input.value = name === 'pendulum' ? '15' : '0.8'; input.dispatchEvent(new Event('change'));
      assert.equal(solution.open, true); assert.equal(panel.hidden, false);
      demo.setLanguage('he'); assert.match(panel.textContent, /התנועה ההרמונית/);
      demo.setLanguage('en'); play.dispatchEvent(new Event('click')); fixture.frame(1000); fixture.frame(1000000);
      assert.equal(fixture.frames.size, 0); assert.match(panel.textContent, /Four periods completed/);
      const escape = new Event('keydown', { cancelable: true }); Object.defineProperty(escape, 'key', { value: 'Escape' }); fixture.root.dispatchEvent(escape);
      assert.equal(panel.hidden, true); assert.equal(fixture.document.activeElement, body);
      demo.dispose(); demo = null; assert.equal(fixture.root.children.length, 0);
    } finally { demo?.dispose(); fixture.cleanup(); }
  });
}
test('period responds to pendulum length and spring stiffness', () => {
  const p = pendulum.defaultParameters, s = spring.defaultParameters;
  near(pendulum.oscillatorState({ ...p, length: p.length * 4 }, 0, 10).period, pendulum.oscillatorState(p, 0, 10).period * 2);
  near(spring.oscillatorState({ ...s, stiffness: s.stiffness * 4 }, 0).period, spring.oscillatorState(s, 0).period / 2);
});

for (const name of ['spring', 'double-spring', 'pendulum']) {
  test(`${name}: drag releases from rest, clamps displacement, and preserves click selection`, async () => {
    const fixture = browserFixture(); let demo;
    try {
      demo = (await demonstrations.find(entry => entry.id === name).load()).mount({ root: fixture.root, lang: 'en' });
      const svg = fixture.find(n => n.tagName === 'svg');
      const body = fixture.find(n => n.getAttribute('class') === 'selectable-mass');
      const input = fixture.find(n => n.id === `${name}-amplitude`);
      const panel = fixture.find(n => n.id === `${name}-analysis`);
      let capture = null, clickTarget = body;
      svg.getScreenCTM = () => ({ inverse: () => ({}) });
      svg.createSVGPoint = () => ({ x: 0, y: 0, matrixTransform() { return { x: this.x, y: this.y }; } });
      for (const node of [svg, body]) {
        node.setPointerCapture = id => { capture = id; clickTarget = node; };
        node.hasPointerCapture = id => capture === id && clickTarget === node;
        node.releasePointerCapture = () => { capture = null; };
      }
      function pointer(type, x, y, id = 1) {
        const event = new Event(type, { cancelable: true });
        Object.defineProperties(event, { target: { value: body }, button: { value: 0 }, pointerId: { value: id }, clientX: { value: x }, clientY: { value: y } });
        svg.dispatchEvent(event);
      }
      const click = (target = clickTarget) => { const event = new Event('click'); Object.defineProperty(event, 'target', { value: target }); svg.dispatchEvent(event); };
      const [x, y] = body.getAttribute('transform').match(/-?\d+(?:\.\d+)?/g).map(Number);
      pointer('pointerdown', x, y);
      pointer('pointerup', x, y);
      click();
      assert.equal(panel.hidden, false, 'A captured press without movement must open the equations');
      click(svg);
      assert.equal(panel.hidden, true);
      pointer('pointerdown', x, y);
      pointer('pointermove', -1000, y, 2); // A different pointer cannot move the mass.
      assert.equal(Number(input.value), name === 'pendulum' ? 10 : 0.6);
      pointer('pointermove', -1000, y);
      assert.equal(Number(input.value), name === 'pendulum' ? -15 : -1);
      assert.equal(fixture.frames.size, 0);
      pointer('pointerup', -1000, y);
      assert.equal(capture, null);
      assert.equal(fixture.frames.size, 1);
      click(); assert.equal(fixture.frames.size, 1);
      assert.equal(panel.hidden, true); // Release must not open the equations.
      const releasedPosition = body.getAttribute('transform');
      fixture.frame(0); fixture.frame(100);
      assert.notEqual(body.getAttribute('transform'), releasedPosition);
      assert.doesNotMatch(body.getAttribute('transform'), /NaN/);
      click(); assert.equal(panel.hidden, false);
      pointer('pointerdown', 400, 320);
      pointer('pointermove', 1400, 320);
      pointer('pointercancel', 1400, 320);
      assert.equal(Number(input.value), name === 'pendulum' ? -15 : -1);
      input.value = '0'; input.dispatchEvent(new Event('change'));
      assert.doesNotMatch(svg.textContent, /NaN/);
      const force = fixture.find(n => n.tagName === 'path' && n.getAttribute('stroke') === 'var(--scene-force-weight, #9a451b)');
      assert.doesNotMatch(force.getAttribute('d'), /NaN|Infinity/);
    } finally { demo?.dispose(); fixture.cleanup(); }
  });
}
