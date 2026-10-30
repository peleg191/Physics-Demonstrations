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
    const horizontal = () => byClass('horizontal-velocity').getAttribute('d');
    const vertical = () => byClass('vertical-velocity').getAttribute('d');
    const peak = fixture.find(n => n.id === 'basketball-peak');
    const initialHorizontal = horizontal();
    const panel = byClass('projectile-components');
    assert.deepEqual(panel.children.map(node => node.tagName), ['h2', 'div']);
    assert.equal(panel.children[0].textContent, strings.en.componentsTitle);
    assert.notEqual(byClass('vertical-velocity').getAttribute('d'), '');
    peak.dispatchEvent(new Event('click'));
    assert.equal(fixture.frames.size, 0);
    assert.equal(horizontal(), initialHorizontal);
    assert.equal(vertical(), '');
    assert.equal(byClass('vertical-velocity').getAttribute('d'), '');
    assert.notEqual(byClass('horizontal-velocity').getAttribute('d'), '');
    const play = fixture.find(n => n.tagName === 'button' && n.textContent === 'Play');
    play.dispatchEvent(new Event('click')); fixture.frame(0); fixture.frame(100);
    assert.equal(horizontal(), initialHorizontal);
    assert.notEqual(vertical(), '');
    demo.setLanguage('he');
    assert.equal(peak.children[0].textContent, strings.he.inspectPeak);
    assert.equal(peak.children[1].tagName, 'math');
    assert.ok(fixture.find(n => n.tagName === 'msub' && n.textContent === 'ymax'));
    assert.equal(panel.children[0].textContent, strings.he.componentsTitle);
    const toggle = fixture.find(n => n.id === 'basketball-components');
    toggle.checked = false; toggle.dispatchEvent(new Event('change'));
    assert.equal(byClass('velocity-components').getAttribute('display'), 'none');
    toggle.checked = true; toggle.dispatchEvent(new Event('change'));
    const speed = fixture.find(n => n.id === 'basketball-speed'); speed.value = '9'; speed.dispatchEvent(new Event('change'));
    peak.dispatchEvent(new Event('click'));
    assert.equal(vertical(), '');
    assert.notEqual(horizontal(), initialHorizontal);
    demo.reset();
    assert.notEqual(vertical(), '');
  } finally { demo?.dispose(); fixture.cleanup(); }
});


test('special point controls inspect release, hoop crossing and landing, with unavailable crossings disabled', () => {
  const fixture = browserFixture(); let demo;
  const findId = id => fixture.find(n => n.id === `basketball-${id}`);
  const readout = () => fixture.find(n => n.className === 'metrics').textContent;
  try {
    demo = mount({ root: fixture.root, lang: 'en' });
    findId('hoop').dispatchEvent(new Event('click'));
    assert.match(readout(), /4\.00/);
    assert.equal(findId('hoop').getAttribute('aria-pressed'), 'true');
    assert.equal(fixture.frames.size, 0);
    findId('landing').dispatchEvent(new Event('click'));
    assert.equal(findId('landing').getAttribute('aria-pressed'), 'true');
    findId('release').dispatchEvent(new Event('click'));
    assert.equal(findId('release').getAttribute('aria-pressed'), 'true');
    assert.match(readout(), /2\.50/);
    const speed = findId('speed'); speed.value = '1'; speed.dispatchEvent(new Event('change'));
    assert.equal(findId('hoop').disabled, true);
    assert.equal(findId('hoop').title, strings.en.hoopUnavailable);
    const before = readout(); findId('hoop').dispatchEvent(new Event('click'));
    assert.equal(readout(), before);
    demo.setLanguage('he');
    assert.equal(findId('hoop').title, strings.he.hoopUnavailable);
    speed.value = '9'; speed.dispatchEvent(new Event('change'));
    assert.equal(findId('hoop').disabled, false);
    assert.equal(findId('hoop').title, '');
  } finally { demo?.dispose(); fixture.cleanup(); }
});
