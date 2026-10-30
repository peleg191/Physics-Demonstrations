import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { browserFixture } from './dom-fixture.js';
import { mount } from '../public/js/demos/basketball/index.js';
import { motionAnalysis } from '../public/js/demos/basketball/analysis.js';
import { strings } from '../public/js/demos/basketball/strings.js';
import { projectileState, flightDuration, velocityComponents } from '../public/js/demos/basketball/physics.js';
setMaxListeners(0);
const hasClass = name => node => node.className.split(' ').includes(name);
function dispatch(svg, target, type = 'click', key) {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, 'target', { value: target });
  if (key) Object.defineProperty(event, 'key', { value: key });
  svg.dispatchEvent(event); return event;
}

test('ball selection survives rebuilt scenes, playback, localization and dismissal, with complete cleanup', () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = mount({ root: fixture.root, lang: 'en' });
    const svg = fixture.find(n => n.tagName === 'svg');
    const panel = fixture.find(hasClass('body-analysis'));
    const ball = () => fixture.find(n => n.getAttribute('class') === 'selectable-ball');
    const orientation = () => fixture.find(n => n.getAttribute('class') === 'motion-orientation');
    const play = fixture.find(n => n.tagName === 'button' && n.textContent === 'Play');
    const time = fixture.find(hasClass('metric-value'));
    assert.equal(panel.hidden, true); assert.equal(svg.getAttribute('role'), 'group');
    play.dispatchEvent(new Event('click')); fixture.frame(0); fixture.frame(500);
    const previousBall = ball();
    // Target the artwork, rather than the wrapper: delegation must recognize descendants.
    dispatch(svg, ball().children.at(-1).children[1]);
    assert.equal(time.textContent, '0.50s'); assert.equal(fixture.frames.size, 0);
    assert.match(panel.textContent, /Playback paused/); assert.equal(ball().getAttribute('aria-pressed'), 'true');
    assert.equal(orientation().getAttribute('display'), 'inline');
    assert.doesNotMatch(ball().getAttribute('transform'), /rotate/);
    assert.match(ball().children.at(-1).getAttribute('transform'), /rotate/);
    const [numeric, solution] = panel.children.filter(n => n.tagName === 'details');
    assert.equal(numeric.hidden, true); assert.equal(solution.hidden, false); solution.open = true;
    const input = fixture.find(n => n.id === 'basketball-speed'); input.value = '9'; input.dispatchEvent(new Event('change'));
    assert.notEqual(ball(), previousBall); assert.equal(ball().getAttribute('aria-pressed'), 'true');
    assert.equal(time.textContent, '0.00s'); assert.equal(solution.open, true);
    assert.equal(panel.hidden, false); assert.equal(fixture.frames.size, 0);
    demo.reset(); assert.equal(solution.open, true);
    const defaults = fixture.find(n => n.tagName === 'button' && n.textContent === 'Restore defaults');
    defaults.dispatchEvent(new Event('click')); assert.equal(ball().getAttribute('aria-pressed'), 'true');
    const compare = fixture.find(n => n.type === 'checkbox'); compare.checked = false; compare.dispatchEvent(new Event('change'));
    demo.setLanguage('he'); assert.match(panel.textContent, /משוואות התנועה/); assert.equal(solution.open, true);
    assert.ok(fixture.find(n => n.tagName === 'mfrac')); assert.ok(fixture.find(n => n.tagName === 'msup'));
    assert.ok(fixture.find(n => n.tagName === 'mi' && n.getAttribute('mathvariant') === 'normal' && n.textContent === 'cos'));
    demo.setLanguage('en'); play.dispatchEvent(new Event('click')); fixture.frame(1000); fixture.frame(1100);
    const beforeDismiss = time.textContent;
    dispatch(svg, svg); assert.equal(panel.hidden, true); assert.equal(fixture.frames.size, 0);
    assert.equal(time.textContent, beforeDismiss); assert.equal(orientation().getAttribute('display'), 'none');
    const enter = dispatch(svg, ball(), 'keydown', 'Enter'); assert.equal(enter.defaultPrevented, true);
    assert.equal(panel.hidden, false); assert.equal(fixture.frames.size, 0);
    const escape = new Event('keydown', { cancelable: true }); Object.defineProperty(escape, 'key', { value: 'Escape' });
    fixture.root.dispatchEvent(escape); assert.equal(panel.hidden, true); assert.equal(fixture.document.activeElement, ball());
    dispatch(svg, ball(), 'keydown', ' '); assert.equal(panel.hidden, false);
    play.dispatchEvent(new Event('click')); fixture.frame(2000); fixture.frame(100000);
    assert.equal(fixture.frames.size, 0); assert.match(panel.textContent, /ground contact/);
    const close = fixture.find(n => n.tagName === 'button' && n.textContent === 'Close analysis');
    close.dispatchEvent(new Event('click')); assert.equal(panel.hidden, true); assert.equal(fixture.document.activeElement, ball());
    demo.dispose(); demo = null; fixture.document.activeElement = fixture.root;
    dispatch(svg, previousBall); assert.equal(panel.hidden, true); assert.equal(fixture.root.children.length, 0);
    assert.equal(fixture.frames.size, 0); assert.equal(fixture.document.activeElement, fixture.root);
  } finally { demo?.dispose(); fixture.cleanup(); }
});

test('trajectory relation agrees with analytic flight across launch parameters and configured gravity', () => {
  for (const gravity of [3.7, 10, 20]) for (const angle of [5, 45, 85]) for (const speed of [1, Math.sqrt(40), 15]) {
    const params = { speed, angle, releaseHeight: 2.5 };
    const theta = angle * Math.PI / 180;
    for (const fraction of [0, .1, .5, 1]) {
      const state = projectileState(params, flightDuration(params, gravity) * fraction, gravity);
      const height = params.releaseHeight + state.x * Math.tan(theta) - gravity * state.x ** 2 / (2 * speed ** 2 * Math.cos(theta) ** 2);
      assert.ok(Math.abs(height - state.y) < 1e-9);
    }
    const { vy, vx } = velocityComponents(params), apex = projectileState(params, vy / gravity, gravity);
    assert.ok(Math.abs(apex.vy) < 1e-9); assert.equal(apex.vx, vx); assert.equal(apex.ay, -gravity);
  }
});

test('kinematics equations and derivation are authored, symbolic and accessible in both languages', () => {
  for (const words of [strings.en, strings.he]) {
    const analysis = motionAnalysis(words);
    assert.equal(analysis.numeric, undefined); assert.equal(analysis.groups.length, 2);
    const math = [...analysis.equations, ...analysis.groups.flatMap(group => group.steps), ...analysis.solution].filter(step => step.math);
    for (const step of math) { assert.ok(step.label); assert.ok(step.expression); assert.doesNotMatch(step.text, /≈|kg|m\/s|\d+\.\d+/); }
    assert.equal(analysis.solution.find(step => step.text.startsWith('y(x) = y₀ + x tan')).text, 'y(x) = y₀ + x tan θ − gx² / (2v₀² cos² θ)');
    const components = analysis.equations.filter(step => step.math);
    assert.deepEqual(components[0].expression[1], ['msub', ['mi', 'v'], ['mrow', ['mn', '0'], ['mi', 'x']]]);
  }
});

test('optional trail samples equal simulated times and follows playback, reset and localization', () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = mount({ root: fixture.root, lang: 'en' });
    const toggle = fixture.find(n => n.id === 'basketball-trail');
    const dots = () => fixture.find(n => n.getAttribute('class') === 'basketball-trail').children;
    const visible = () => dots().filter(n => n.getAttribute('display') === 'inline');
    assert.equal(toggle.checked, false); assert.equal(visible().length, 0);
    toggle.checked = true; toggle.dispatchEvent(new Event('change'));
    assert.equal(visible().length, 1);
    const play = fixture.find(n => n.tagName === 'button' && n.textContent === 'Play');
    play.dispatchEvent(new Event('click')); fixture.frame(0); fixture.frame(350);
    assert.equal(visible().length, 4);
    const xs = visible().map(n => Number(n.getAttribute('cx')));
    const ys = visible().map(n => Number(n.getAttribute('cy')));
    assert.ok(Math.abs((xs[2] - xs[1]) - (xs[1] - xs[0])) < 1e-9);
    assert.ok(ys[2] - 2 * ys[1] + ys[0] > 0);
    demo.setLanguage('he'); assert.equal(visible().length, 4);
    assert.match(toggle.parentNode.textContent, /עקבות/);
    toggle.checked = false; toggle.dispatchEvent(new Event('change')); assert.equal(visible().length, 0);
    toggle.checked = true; toggle.dispatchEvent(new Event('change'));
    demo.reset(); assert.equal(visible().length, 1);
    const speed = fixture.find(n => n.id === 'basketball-speed'); speed.value = '9'; speed.dispatchEvent(new Event('change'));
    assert.equal(visible().length, 1);
    demo.setLanguage('en');
    fixture.find(n => n.tagName === 'button' && n.textContent === 'Restore defaults').dispatchEvent(new Event('click'));
    assert.equal(toggle.checked, false); assert.equal(visible().length, 0);
  } finally { demo?.dispose(); fixture.cleanup(); }
});
