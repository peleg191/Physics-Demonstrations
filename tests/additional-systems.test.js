import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { oscillatorState, defaultParameters as springDefaults } from '../public/js/demos/double-spring/physics.js';
import { carouselState, defaultParameters as carouselDefaults } from '../public/js/demos/carousel/physics.js';
import { demonstrations } from '../public/js/registry.js';
import { browserFixture } from './dom-fixture.js';
setMaxListeners(0);
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('opposite identical springs: force sum, energy, period and initial conditions', () => {
  for (const mass of [1, 4, 30]) for (const stiffness of [1, 16, 100]) {
    const params = { ...springDefaults, mass, stiffness };
    const initial = oscillatorState(params, 0);
    near(initial.position, params.amplitude); near(initial.velocity, 0);
    near(initial.period, 2 * Math.PI * Math.sqrt(mass / (2 * stiffness)));
    for (const fraction of [0.1, 0.25, 0.5, 0.9, 1]) {
      const state = oscillatorState(params, initial.period * fraction);
      near(mass * state.acceleration, -2 * stiffness * state.position);
      near(state.potential, stiffness * state.position ** 2);
      near(state.kinetic + state.potential, initial.potential);
    }
  }
});

test('carousel: steady orbit, vertical balance, inward force and mass independence', () => {
  for (const radius of [0.2, 1, 3]) for (const angle of [10, 45, 75]) {
    const params = { ...carouselDefaults, radius, angle }, alpha = angle * Math.PI / 180;
    const state = carouselState(params, 0.37);
    near(state.tension * Math.cos(alpha), params.mass * 10);
    near(state.tension * Math.sin(alpha), params.mass * state.speed ** 2 / radius);
    near(Math.hypot(...state.position), radius);
    near(Math.hypot(...state.velocity), state.speed);
    near(state.position[0] * state.velocity[0] + state.position[1] * state.velocity[1], 0);
    state.accelerations.forEach((value, i) => near(value, -(state.omega ** 2) * state.position[i]));
    const heavier = carouselState({ ...params, mass: 2 * params.mass }, 0.37);
    near(heavier.speed, state.speed); near(heavier.tension, 2 * state.tension);
    near(state.length * Math.sin(alpha), radius);
  }
  near(carouselState(carouselDefaults, 0).speed, Math.sqrt(10));
});

for (const id of ['double-spring', 'carousel']) {
  test(`${id}: keyboard selection pauses playback and localizes force analysis`, async () => {
    const fixture = browserFixture(); let demo;
    try {
      demo = (await demonstrations.find(entry => entry.id === id).load()).mount({ root: fixture.root, lang: 'en' });
      fixture.find(node => node.tagName === 'button' && node.textContent === 'Play').dispatchEvent(new Event('click'));
      fixture.frame(0); fixture.frame(500);
      const mass = fixture.find(node => node.getAttribute('class') === 'selectable-mass');
      const key = new Event('keydown', { cancelable: true }); key.key = 'Enter';
      if (id === 'double-spring') { Object.defineProperty(key, 'target', { value: mass }); fixture.find(node => node.getAttribute('class') === 'system-svg').dispatchEvent(key); }
      else mass.dispatchEvent(key);
      assert.equal(fixture.frames.size, 0);
      const panel = fixture.find(node => node.id === `${id}-analysis`);
      assert.equal(panel.hidden, false);
      assert.match(panel.textContent, /Playback paused/);
      demo.setLanguage('he'); assert.match(panel.textContent, /הושהתה/);
      const escape = new Event('keydown', { cancelable: true }); escape.key = 'Escape'; fixture.root.dispatchEvent(escape);
      assert.equal(panel.hidden, true);
    } finally { demo?.dispose(); fixture.cleanup(); }
  });
}

test('carousel depth cues follow orbital phase, retain constant height, and clear on reset', async () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = (await demonstrations.find(entry => entry.id === 'carousel').load()).mount({ root: fixture.root, lang: 'en' });
    const trail = fixture.find(node => node.getAttribute('class') === 'carousel-side-trail');
    const artwork = fixture.find(node => node.getAttribute('class') === 'carousel-ball-art');
    assert.equal(trail.getAttribute('display'), 'none');
    assert.equal(artwork.getAttribute('transform'), 'scale(1)');
    const play = fixture.find(node => node.tagName === 'button' && node.textContent === 'Play');
    const period = carouselState(carouselDefaults, 0).period;
    play.dispatchEvent(new Event('click')); fixture.frame(0); fixture.frame(period * 250);
    assert.equal(trail.getAttribute('display'), 'inline');
    assert.match(artwork.getAttribute('transform'), /scale\(1\.12\)/);
    const frontOpacity = Number(artwork.getAttribute('opacity'));
    const segments = trail.children.filter(node => node.getAttribute('class') === 'carousel-trail-segment');
    const height = segments[0].getAttribute('d').split(' ')[2];
    assert.ok(segments.every(segment => {
      const parts = segment.getAttribute('d').split(' ');
      return parts[2] === height && parts[5] === height;
    }));
    const visible = segments.filter(segment => Number(segment.getAttribute('opacity')) > 0);
    assert.ok(visible.length > 0);
    assert.ok(Number(visible.at(-1).getAttribute('stroke-width')) > Number(visible[0].getAttribute('stroke-width')));
    assert.equal(Number(segments.at(-1).getAttribute('opacity')), 0, 'trail must not obscure the ball');
    fixture.frame(period * 750);
    assert.match(artwork.getAttribute('transform'), /scale\(0\.88\)/);
    assert.ok(Number(artwork.getAttribute('opacity')) < frontOpacity);
    assert.equal(segments[0].getAttribute('d').split(' ')[2], height);
    demo.reset();
    assert.equal(trail.getAttribute('display'), 'none');
    assert.equal(artwork.getAttribute('transform'), 'scale(1)');
    assert.equal(artwork.getAttribute('opacity'), '1');
  } finally { demo?.dispose(); fixture.cleanup(); }
});

for (const [name, replacement, visible] of [
  ['older configuration without carousel settings', '', true],
  ['trail disabled in configuration', 'export const carouselConfig = Object.freeze({ showTrail: false });', false],
]) {
  test(`carousel loads with ${name}`, async () => {
    const directory = await mkdtemp(join(tmpdir(), 'carousel-config-'));
    const fixture = browserFixture(); let demo;
    try {
      await cp(new URL('../public/js/', import.meta.url), directory, { recursive: true });
      const configPath = join(directory, 'config.js');
      await writeFile(join(directory, 'package.json'), '{"type":"module"}');
      const source = await readFile(configPath, 'utf8');
      await writeFile(configPath, source.replace(/export const carouselConfig = .*;/, replacement));
      const module = await import(pathToFileURL(join(directory, 'demos/carousel/index.js')).href);
      demo = module.mount({ root: fixture.root, lang: 'en' });
      fixture.find(node => node.tagName === 'button' && node.textContent === 'Play').dispatchEvent(new Event('click'));
      fixture.frame(0); fixture.frame(500);
      const trail = fixture.find(node => node.getAttribute('class') === 'carousel-side-trail');
      assert.equal(trail.getAttribute('display'), visible ? 'inline' : 'none');
      assert.equal(fixture.frames.size, 1);
    } finally { demo?.dispose(); fixture.cleanup(); await rm(directory, { recursive: true, force: true }); }
  });
}
