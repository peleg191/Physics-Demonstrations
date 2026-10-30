import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { browserFixture } from './dom-fixture.js';
import { demonstrations } from '../public/js/registry.js';
setMaxListeners(0);
for (const [id, key, value, label] of [
  ['spring', 'amplitude', '0.8', 'x₀ = 0.80 m'],
  ['pendulum', 'amplitude', '15', 'θ₀ = 15.0°'],
  ['basketball', 'angle', '60', 'θ = 60°'],
  ['incline', 'angle', '40', 'θ = 40.0°'],
]) {
  test(`${id}: initial geometry follows controls, playback, language and reset`, async () => {
    const fixture = browserFixture(); let demo;
    try {
      demo = (await demonstrations.find(entry => entry.id === id).load()).mount({ root: fixture.root, lang: 'en' });
      const geometry = () => fixture.find(n => n.getAttribute('class') === 'initial-geometry');
      assert.equal(geometry().getAttribute('display'), 'inline');
      const input = fixture.find(n => n.id === `${id}-${key}`);
      input.value = value; input.dispatchEvent(new Event('change'));
      assert.ok(geometry().textContent.includes(label), geometry().textContent);
      demo.setLanguage('he');
      assert.equal(geometry().getAttribute('display'), 'inline');
      demo.setLanguage('en');
      fixture.find(n => n.tagName === 'button' && n.textContent === 'Play').dispatchEvent(new Event('click'));
      assert.equal(geometry().getAttribute('display'), 'none');
      fixture.frame(0); fixture.frame(100);
      demo.reset();
      assert.equal(geometry().getAttribute('display'), 'inline');
      assert.ok(geometry().textContent.includes(label));
    } finally { demo?.dispose(); fixture.cleanup(); }
  });
}
