import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { bodyAnalysis } from '../public/js/demos/pulley/analysis.js';
import { strings } from '../public/js/demos/pulley/strings.js';
import { mount } from '../public/js/demos/pulley/index.js';
import { browserFixture } from './dom-fixture.js';
setMaxListeners(0);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9);
const key = value => { const event = new Event('keydown', { cancelable: true }); Object.defineProperty(event, 'key', { value }); return event; };
const hasClass = name => node => node.className.split(' ').includes(name);

test('analysis forces, axes and common scale agree with Newton equations at both signs and gravity values', () => {
  for (const gravity of [3.7, 10, 20]) for (const [mass1, mass2] of [[10, 10], [10, 5], [5, 10], [1, 30], [30, 1]]) {
    const params = { mass1, mass2 };
    const left = bodyAnalysis(params, gravity, 'mass1', strings.en);
    const right = bodyAnalysis(params, gravity, 'mass2', strings.en);
    assert.equal(left.positiveDirection, 1); assert.equal(right.positiveDirection, -1);
    assert.equal(left.pixelsPerNewton, right.pixelsPerNewton);
    assert.equal(left.forces.length, 2); assert.equal(right.forces.length, 2);
    assert.equal(left.forces[0].direction, -1); assert.equal(left.forces[1].direction, 1);
    close(left.forces[0].magnitude, right.forces[0].magnitude);
    close(left.forces[1].magnitude, mass1 * gravity); close(right.forces[1].magnitude, mass2 * gravity);
    const a = (mass1 - mass2) * gravity / (mass1 + mass2);
    close(left.forces[1].magnitude - left.forces[0].magnitude, mass1 * a);
    close(right.forces[0].magnitude - right.forces[1].magnitude, mass2 * a);
    for (const force of [...left.forces, ...right.forces]) assert.ok(force.magnitude * left.pixelsPerNewton <= 90.000001);
  }
  close(bodyAnalysis({ mass1: 10, mass2: 5 }, 10, 'mass1', strings.en).forces[0].magnitude, 200 / 3);
});

test('selection pauses in place; keyboard, focus, expansions, translation, cutoff and disposal preserve coherent state', () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = mount({ root: fixture.root, lang: 'en' });
    const left = fixture.find(n => n.getAttribute('role') === 'button' && n.getAttribute('aria-label').includes('Left'));
    const right = fixture.find(n => n.getAttribute('role') === 'button' && n.getAttribute('aria-label').includes('Right'));
    const panel = fixture.find(hasClass('body-analysis'));
    const play = fixture.find(n => n.tagName === 'button' && n.textContent === 'Play');
    const time = fixture.find(hasClass('metric-value'));
    const overlay = fixture.find(n => n.getAttribute('class') === 'canvas-forces');
    assert.equal(overlay.getAttribute('display'), 'none');
    assert.equal(panel.hidden, true);
    play.dispatchEvent(new Event('click')); fixture.frame(0); fixture.frame(500);
    left.dispatchEvent(key('Enter'));
    assert.equal(time.textContent, '0.50s'); assert.equal(fixture.frames.size, 0);
    assert.equal(panel.hidden, false); assert.match(panel.textContent, /Playback paused/);
    assert.ok(fixture.find(n => n.tagName === 'math'));
    assert.ok(fixture.find(n => n.tagName === 'mfrac'));
    assert.ok(fixture.find(n => n.tagName === 'msub'));
    assert.equal(overlay.getAttribute('display'), 'inline');
    assert.equal(overlay.getAttribute('transform'), 'translate(330 300)');
    assert.equal(fixture.find(n => n.getAttribute('class') === 'force-diagram'), undefined);
    for (const arrow of overlay.children) {
      const shaft = arrow.children[0];
      assert.equal(shaft.getAttribute('x1'), '0'); assert.equal(shaft.getAttribute('x2'), '0');
      assert.equal(shaft.getAttribute('stroke-width'), '6');
    }
    assert.equal(left.getAttribute('aria-pressed'), 'true');
    const expansions = panel.children.filter(n => n.tagName === 'details'); expansions.forEach(n => n.open = true);
    right.dispatchEvent(key(' ')); assert.equal(right.getAttribute('aria-pressed'), 'true'); assert.equal(left.getAttribute('aria-pressed'), 'false');
    demo.setLanguage('he'); assert.equal(time.textContent, '0.50s'); assert.ok(expansions.every(n => n.open));
    assert.match(panel.textContent, /ניתוח גוף/);
    panel.dispatchEvent(key('Escape')); assert.equal(panel.hidden, true); assert.equal(overlay.getAttribute('display'), 'none'); assert.equal(fixture.document.activeElement, right);
    assert.equal(time.textContent, '0.50s'); assert.equal(fixture.frames.size, 0);
    left.dispatchEvent(new Event('click'));
    const canvas = fixture.find(n => n.tagName === 'svg');
    canvas.dispatchEvent(new Event('click'));
    assert.equal(panel.hidden, true); assert.equal(overlay.getAttribute('display'), 'none');
    assert.equal(left.getAttribute('aria-pressed'), 'false'); assert.equal(right.getAttribute('aria-pressed'), 'false');
    assert.equal(time.textContent, '0.50s'); assert.equal(fixture.frames.size, 0);
    left.dispatchEvent(new Event('click'));
    const input = fixture.find(n => n.tagName === 'input' && n.type === 'number');
    input.value = '30'; input.dispatchEvent(new Event('change'));
    assert.equal(panel.hidden, false); assert.equal(time.textContent, '0.00s'); assert.ok(expansions.every(n => n.open));
    demo.reset(); assert.equal(left.getAttribute('aria-pressed'), 'true');
    demo.setLanguage('en'); play.dispatchEvent(new Event('click')); fixture.frame(1000); fixture.frame(10000);
    assert.match(panel.textContent, /travel cutoff/); assert.equal(fixture.frames.size, 0);
    assert.equal(panel.hidden, false);
    demo.dispose(); demo = null;
    assert.equal(fixture.root.children.length, 0);
    left.dispatchEvent(new Event('click')); assert.equal(fixture.frames.size, 0);
  } finally { demo?.dispose(); fixture.cleanup(); }
});

test('worked solution stays symbolic while current-value substitution remains separate', () => {
  for (const words of [strings.en, strings.he]) {
    const a = bodyAnalysis({ mass1: 10, mass2: 5 }, 10, 'mass1', words);
    const b = bodyAnalysis({ mass1: 30, mass2: 1 }, 3.7, 'mass1', words);
    assert.deepEqual(a.solution, b.solution);
    assert.notDeepEqual(a.numeric, b.numeric);
    assert.ok(a.solution.some(step => step.text === 'a = (m₁ − m₂)g / (m₁ + m₂)'));
    assert.ok(a.solution.some(step => step.text === 'T = m₁(g − a) = 2m₁m₂g / (m₁ + m₂)'));
    assert.ok(a.solution.every(step => !/≈|kg|m\/s/.test(step.text)));
  }
});
