import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { demonstrations } from '../public/js/registry.js';
import { browserFixture } from './dom-fixture.js';
setMaxListeners(0); // Each mounted shell intentionally shares one AbortSignal.
const hasClass = name => node => node.className.split(' ').includes(name);
for (const entry of demonstrations) {
  test(`${entry.id}: mount, animate, translate without reset, edit, reset, and dispose`, async () => {
    const fixture = browserFixture(); let demo;
    try {
      const module = await entry.load(); demo = module.mount({ root: fixture.root, lang: 'en' });
      const play = fixture.find(node => node.tagName === 'button' && node.textContent === 'Play');
      assert.ok(play);
      assert.ok(fixture.find(node => node.getAttribute('class') === 'transport-icon', play));
      const canvas = fixture.find(node => node.getAttribute('class') === 'system-svg');
      canvas.dispatchEvent(new Event('click')); assert.equal(fixture.frames.size, 1);
      assert.equal(play.textContent, 'Pause');
      canvas.dispatchEvent(new Event('click')); assert.equal(fixture.frames.size, 0);
      assert.equal(play.textContent, 'Play');
      play.dispatchEvent(new Event('click')); fixture.frame(0); fixture.frame(500);
      const timeMetric = fixture.find(hasClass('metric-value'));
      assert.equal(timeMetric.textContent, '0.50s'); assert.equal(fixture.frames.size, 1);
      demo.setLanguage('he'); assert.equal(timeMetric.textContent, '0.50s'); assert.equal(fixture.frames.size, 1);
      assert.ok(fixture.find(node => node.tagName === 'button' && node.textContent === 'השהיה'));
      const input = fixture.find(node => node.tagName === 'input' && node.type === 'number');
      input.value = entry.id === 'basketball' ? '7.2' : '15'; input.dispatchEvent(new Event('change'));
      assert.equal(timeMetric.textContent, '0.00s'); assert.equal(fixture.frames.size, 0);
      input.value = ''; input.dispatchEvent(new Event('change'));
      assert.equal(input.value, entry.id === 'basketball' ? '7.2' : '15');
      play.dispatchEvent(new Event('click')); assert.equal(fixture.frames.size, 1);
      fixture.document.hidden = true; fixture.document.dispatchEvent(new Event('visibilitychange')); assert.equal(fixture.frames.size, 0);
      demo.reset(); assert.equal(timeMetric.textContent, '0.00s');
      play.dispatchEvent(new Event('click')); demo.dispose(); demo = null;
      assert.equal(fixture.frames.size, 0); assert.equal(fixture.root.children.length, 0);
      play.dispatchEvent(new Event('click')); assert.equal(fixture.frames.size, 0);
    } finally { demo?.dispose(); fixture.cleanup(); }
  });
}
