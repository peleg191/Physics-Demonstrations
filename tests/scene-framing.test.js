import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { browserFixture } from './dom-fixture.js';
import { demonstrations } from '../public/js/registry.js';
setMaxListeners(0);

const descendants = node => [node, ...node.children.flatMap(descendants)];
function assertBodiesFit(svg) {
  const [left, top, width, height] = svg.getAttribute('viewBox').split(' ').map(Number);
  assert.ok(width > 0 && height > 0);
  const bodies = descendants(svg).filter(node => node.getAttribute('class') === 'mass-body');
  const ball = descendants(svg).find(node => node.getAttribute('class') === 'selectable-ball');
  if (ball) {
    const [x, y] = ball.getAttribute('transform').match(/translate\(([^)]+)\)/)[1].split(' ').map(Number);
    const artwork = ball.children.find(node => (node.getAttribute('transform') ?? '').includes('scale(1.5)'));
    const radius = Number(artwork.children[0].getAttribute('r')) * 1.5;
    assert.ok(x - radius >= left && x + radius <= left + width);
    assert.ok(y - radius >= top && y + radius <= top + height);
  }
  assert.ok(bodies.length || ball);
  for (const body of bodies) {
    const transform = body.parentNode.getAttribute('transform');
    const [x, y] = transform.match(/translate\(([^)]+)\)/)[1].split(' ').map(Number);
    const angle = Number(transform.match(/rotate\(([^)]+)\)/)?.[1] ?? 0) * Math.PI / 180;
    const radius = Number(body.getAttribute('r'));
    const bx = radius ? -radius : Number(body.getAttribute('x'));
    const by = radius ? -radius : Number(body.getAttribute('y'));
    const bw = radius ? 2 * radius : Number(body.getAttribute('width'));
    const bh = radius ? 2 * radius : Number(body.getAttribute('height'));
    for (const [cx, cy] of [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]]) {
      const px = x + cx * Math.cos(angle) - cy * Math.sin(angle);
      const py = y + cx * Math.sin(angle) + cy * Math.cos(angle);
      assert.ok(px >= left && px <= left + width && py >= top && py <= top + height,
        `Body corner ${px}, ${py} falls outside ${svg.getAttribute('viewBox')}`);
    }
  }
}

for (const [id, configurations] of [
  ['basketball', [{ speed: 1, angle: 5, releaseHeight: 0.5 }, { speed: 15, angle: 85, releaseHeight: 5 }]],
  ['spring', [{ amplitude: 0.05 }, { amplitude: 1 }]],
  ['pendulum', [{ length: 0.5, amplitude: 15 }, { length: 3, amplitude: 15 }]],
  ['incline', [{ angle: 0 }, { angle: 30 }, { angle: 60 }]],
  ['pulley', [{ mass1: 1, mass2: 30 }, { mass1: 30, mass2: 1 }]],
]) {
  test(`${id}: tighter framing contains the bodies through full motion at parameter extremes`, async () => {
    const fixture = browserFixture(); let demo;
    const narrow = new EventTarget(); narrow.matches = false;
    globalThis.matchMedia = query => query === '(max-width: 600px)' ? narrow : { matches: false };
    try {
      demo = (await demonstrations.find(entry => entry.id === id).load()).mount({ root: fixture.root, lang: 'en' });
      const svg = fixture.find(node => node.getAttribute('class') === 'system-svg');
      for (const configuration of configurations) {
        for (const [key, value] of Object.entries(configuration)) {
          const input = fixture.find(node => node.id === `${id}-${key}`);
          input.value = String(value); input.dispatchEvent(new Event('change'));
        }
        const frame = svg.getAttribute('viewBox');
        narrow.matches = !narrow.matches; narrow.dispatchEvent(new Event('change'));
        assert.equal(svg.getAttribute('viewBox'), frame, 'responsive changes must preserve the fitted scene');
        assertBodiesFit(svg);
        fixture.find(node => node.tagName === 'button' && node.textContent === 'Play').dispatchEvent(new Event('click'));
        fixture.frame(0);
        for (const time of [100, 500, 1000, 2000, 100000]) {
          fixture.frame(time); assertBodiesFit(svg);
          assert.equal(svg.getAttribute('viewBox'), frame, 'framing must remain stable during playback');
        }
        demo.reset();
      }
    } finally { demo?.dispose(); fixture.cleanup(); }
  });
}
