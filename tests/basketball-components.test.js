import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { browserFixture } from './dom-fixture.js';
import { mount } from '../public/js/demos/basketball/index.js';
import { strings } from '../public/js/demos/basketball/strings.js';
setMaxListeners(0);

test('velocity components show ascent, exact apex and descent, and survive edits and localization', () => {
  const fixture = browserFixture(); let demo;
  const byClass = name => fixture.find(n => n.getAttribute('class') === name || n.className.split(' ').includes(name));
  try {
    demo = mount({ root: fixture.root, lang: 'en' });
    const horizontal = () => byClass('horizontal-component').textContent;
    const vertical = () => byClass('vertical-component').textContent;
    const peak = fixture.find(n => n.id === 'basketball-peak');
    const initialHorizontal = horizontal();
    assert.match(byClass('component-note').textContent, /rises/);
    assert.notEqual(byClass('vertical-velocity').getAttribute('d'), '');
    peak.dispatchEvent(new Event('click'));
    assert.equal(fixture.frames.size, 0);
    assert.equal(horizontal(), initialHorizontal);
    assert.match(vertical(), /0\.00/);
    assert.equal(byClass('vertical-velocity').getAttribute('d'), '');
    assert.notEqual(byClass('horizontal-velocity').getAttribute('d'), '');
    assert.equal(byClass('component-note').textContent, strings.en.apex);
    const play = fixture.find(n => n.tagName === 'button' && n.textContent === 'Play');
    play.dispatchEvent(new Event('click')); fixture.frame(0); fixture.frame(100);
    assert.equal(horizontal(), initialHorizontal);
    assert.match(vertical(), /-/);
    assert.match(byClass('component-note').textContent, /falls/);
    demo.setLanguage('he');
    assert.equal(peak.children[0].textContent, strings.he.inspectPeak);
    assert.equal(peak.children[1].tagName, 'math');
    assert.ok(fixture.find(n => n.tagName === 'msub' && n.textContent === 'ymax'));
    const toggle = fixture.find(n => n.id === 'basketball-components');
    toggle.checked = false; toggle.dispatchEvent(new Event('change'));
    assert.equal(byClass('projectile-components').hidden, true);
    assert.equal(byClass('velocity-components').getAttribute('display'), 'none');
    toggle.checked = true; toggle.dispatchEvent(new Event('change'));
    const speed = fixture.find(n => n.id === 'basketball-speed'); speed.value = '9'; speed.dispatchEvent(new Event('change'));
    assert.equal(byClass('projectile-components').hidden, false);
    peak.dispatchEvent(new Event('click'));
    assert.match(vertical(), /0\.00/);
    assert.notEqual(horizontal(), initialHorizontal);
    assert.equal(byClass('component-note').textContent, strings.he.apex);
    demo.reset();
    assert.equal(byClass('component-note').textContent, strings.he.componentsRising);
  } finally { demo?.dispose(); fixture.cleanup(); }
});


test('special point controls inspect release, hoop crossing and landing, with unavailable crossings disabled', () => {
  const fixture = browserFixture(); let demo;
  const findId = id => fixture.find(n => n.id === `basketball-${id}`);
  const readout = () => fixture.find(n => n.className === 'trajectory-point-readout').textContent;
  try {
    demo = mount({ root: fixture.root, lang: 'en' });
    findId('hoop').dispatchEvent(new Event('click'));
    assert.match(readout(), /x = 4.00 m/);
    assert.equal(findId('hoop').getAttribute('aria-pressed'), 'true');
    assert.equal(fixture.frames.size, 0);
    findId('landing').dispatchEvent(new Event('click'));
    assert.match(readout(), /y = 0.00 m/);
    assert.match(readout(), /before impact/);
    findId('release').dispatchEvent(new Event('click'));
    assert.match(readout(), /x = 0.00 m · y = 2.50 m · t = 0.00 s/);
    const speed = findId('speed'); speed.value = '1'; speed.dispatchEvent(new Event('change'));
    assert.equal(findId('hoop').disabled, true);
    assert.equal(fixture.find(n => n.className === 'trajectory-point-availability').hidden, false);
    const before = readout(); findId('hoop').dispatchEvent(new Event('click'));
    assert.equal(readout(), before);
    demo.setLanguage('he');
    assert.match(readout(), /נקודת השחרור/);
    speed.value = '9'; speed.dispatchEvent(new Event('change'));
    assert.equal(findId('hoop').disabled, false);
    assert.equal(fixture.find(n => n.className === 'trajectory-point-availability').hidden, true);
  } finally { demo?.dispose(); fixture.cleanup(); }
});
