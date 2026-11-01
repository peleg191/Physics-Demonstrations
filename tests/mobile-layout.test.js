import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
setMaxListeners(0);
import { browserFixture } from './dom-fixture.js';
import { demonstrations } from '../public/js/registry.js';
import { createBodyAnalysis } from '../public/js/core/body-analysis.js';

const hasClass = name => node => node.className.split(' ').includes(name);

test('graphs stay inside the simulation on mobile and desktop', async () => {
  const fixture = browserFixture();
  const originalMedia = globalThis.matchMedia;
  const media = new EventTarget(); media.matches = true;
  globalThis.matchMedia = query => query.includes('orientation: landscape') ? media : { matches: false };
  try {
    for (const entry of demonstrations) {
      const demo = (await entry.load()).mount({ root: fixture.root, lang: 'he' });
      try {
        const graphs = fixture.find(hasClass('motion-graphs'));
        const column = fixture.find(hasClass('stage-column'));
        const stage = fixture.find(hasClass('stage'));
        const transport = fixture.find(hasClass('transport'));
        assert.equal(graphs.parentNode, stage);
        assert.equal(transport.parentNode, stage);
        assert.equal(transport.children.filter(node => node.tagName === 'button').length, 3);
        assert.equal(column.children.includes(graphs), false);
        media.matches = false; media.dispatchEvent(new Event('change'));
        assert.equal(graphs.parentNode, stage);
        media.matches = true; media.dispatchEvent(new Event('change'));
        assert.equal(graphs.parentNode, stage);
        assert.equal(stage.children.filter(node => node === graphs).length, 1);
      } finally { demo.dispose(); }
    }
  } finally { globalThis.matchMedia = originalMedia; fixture.cleanup(); }
});

test('mobile analysis opens and closes without scrolling or moving focus', () => {
  const fixture = browserFixture();
  const originalMedia = globalThis.matchMedia, originalScroll = globalThis.scrollTo;
  globalThis.matchMedia = () => ({ matches: true });
  const scrolls = []; globalThis.scrollTo = options => scrolls.push(options);
  const controller = new AbortController();
  try {
    const analysis = createBodyAnalysis({ parent: fixture.root, signal: controller.signal, id: 'mobile-analysis', onClose() {} });
    const title = fixture.find(node => node.tagName === 'h2');
    let reveals = 0; title.scrollIntoView = () => reveals++;
    const data = { title: 'Forces', close: 'Close', axis: 'x', equations: [] };
    analysis.update(data); fixture.frame(0);
    assert.equal(analysis.root.hidden, false);
    assert.equal(reveals, 0);
    assert.notEqual(fixture.document.activeElement, title);
    analysis.update({ ...data, axis: 'y' }); fixture.frame(10);
    assert.equal(reveals, 0);
    analysis.hide();
    assert.equal(analysis.root.hidden, true);
    assert.equal(scrolls.length, 0);
    analysis.update(data); analysis.hide(); fixture.frame(20);
    assert.equal(reveals, 0);
    analysis.update(data); fixture.frame(30);
    assert.equal(reveals, 0);
  } finally {
    controller.abort(); globalThis.matchMedia = originalMedia;
    if (originalScroll === undefined) delete globalThis.scrollTo; else globalThis.scrollTo = originalScroll;
    fixture.cleanup();
  }
});


test('phone and tablet parameters precede metrics and return to the desktop sidebar', async () => {
  const fixture = browserFixture();
  const originalMedia = globalThis.matchMedia;
  const stacked = new EventTarget(); stacked.matches = true;
  globalThis.matchMedia = query => query.includes('max-width: 900px') ? stacked : { matches: query.includes('orientation: landscape') };
  try {
    for (const entry of demonstrations) {
      const demo = (await entry.load()).mount({ root: fixture.root, lang: 'en' });
      try {
        const column = fixture.find(hasClass('stage-column'));
        const stage = fixture.find(hasClass('stage'));
        const panel = fixture.find(hasClass('control-panel'));
        const parameters = fixture.find(hasClass('parameters'));
        const quiz = fixture.find(hasClass('system-quiz'));
        const layout = fixture.find(hasClass('experiment-layout'));
        assert.equal(panel.parentNode, column);
        assert.equal(column.children.indexOf(panel), column.children.indexOf(stage) + 1);
        assert.ok(column.children.indexOf(panel) < column.children.indexOf(fixture.find(hasClass('metrics'))));
        assert.equal(parameters.parentNode, panel);
        assert.equal(quiz.parentNode, fixture.root);
        const input = fixture.find(node => node.type === 'number');
        input.value = String(Number(input.value) + 1);
        input.dispatchEvent(new Event('change'));
        assert.equal(panel.parentNode, column);
        stacked.matches = false; stacked.dispatchEvent(new Event('change'));
        assert.equal(panel.parentNode, layout);
        assert.equal(quiz.parentNode, fixture.root);
        stacked.matches = true; stacked.dispatchEvent(new Event('change'));
        assert.equal(panel.parentNode, column);
        assert.equal(column.children.filter(node => node === panel).length, 1);
      } finally { demo.dispose(); }
    }
  } finally { globalThis.matchMedia = originalMedia; fixture.cleanup(); }
});

test('mobile graph dock expands, preserves selection, and restores focus and scrolling', async () => {
  const fixture = browserFixture(); let demo;
  const media = new EventTarget(); media.matches = true;
  const landscape = new EventTarget(); landscape.matches = false;
  globalThis.matchMedia = query => query.includes('max-width: 900px') ? media : query === '(orientation: landscape)' ? landscape : { matches: false };
  const body = fixture.document.createElement('body'); fixture.document.body = body;
  const outside = fixture.document.createElement('header'); outside.inert = false;
  body.style.overflow = 'auto'; body.append(outside, fixture.root);
  try {
    demo = (await demonstrations[0].load()).mount({ root: fixture.root, lang: 'en' });
    const graphs = fixture.find(hasClass('motion-graphs')), stage = fixture.find(hasClass('stage'));
    let availableWidth = 320;
    Object.defineProperty(graphs, 'clientWidth', { get: () => availableWidth });
    const controls = fixture.find(hasClass('graph-controls'));
    const checkbox = controls.children[0].children[0];
    const expand = fixture.find(hasClass('graph-window-expand'));
    checkbox.checked = true; checkbox.dispatchEvent(new Event('change'));
    assert.equal(graphs.parentNode, stage);
    assert.equal(hasClass('graphs-docked')(stage), true);
    assert.equal(hasClass('is-docked')(graphs), true);
    assert.equal(expand.hidden, false);
    const tabs = fixture.find(hasClass('graph-tabs')).children;
    assert.deepEqual(tabs.map(tab => tab.getAttribute('aria-pressed')), ['true', 'false', 'false']);
    tabs[1].dispatchEvent(new Event('click'));
    assert.equal(hasClass('is-horizontal')(fixture.find(hasClass('graph-grid'))), false);
    expand.dispatchEvent(new Event('click'));
    assert.equal(fixture.find(hasClass('graph-dock-placeholder')).hidden, false);
    assert.equal(graphs.getAttribute('role'), 'dialog');
    assert.equal(graphs.getAttribute('aria-modal'), 'true');
    assert.equal(outside.inert, true); assert.equal(body.style.overflow, 'hidden');
    assert.equal(fixture.document.activeElement, expand);
    assert.equal(expand.getAttribute('aria-expanded'), 'true');
    const previous = new Event('keydown', { cancelable: true });
    Object.defineProperties(previous, { key: { value: 'Tab' }, shiftKey: { value: true } });
    graphs.dispatchEvent(previous); assert.equal(fixture.document.activeElement, tabs.at(-1));
    const forward = new Event('keydown', { cancelable: true }); Object.defineProperty(forward, 'key', { value: 'Tab' });
    graphs.dispatchEvent(forward); assert.equal(fixture.document.activeElement, expand);
    assert.deepEqual(tabs.map(tab => tab.getAttribute('aria-pressed')), ['true', 'true', 'false']);
    availableWidth = 800; media.dispatchEvent(new Event('change'));
    assert.equal(hasClass('is-horizontal')(fixture.find(hasClass('graph-grid'))), true);
    availableWidth = 520; landscape.matches = true; landscape.dispatchEvent(new Event('change'));
    assert.equal(hasClass('is-horizontal')(fixture.find(hasClass('graph-grid'))), true);
    const escape = new Event('keydown', { cancelable: true }); Object.defineProperty(escape, 'key', { value: 'Escape' });
    graphs.dispatchEvent(escape);
    assert.equal(hasClass('is-expanded')(graphs), false);
    assert.equal(graphs.hidden, false);
    assert.equal(fixture.find(hasClass('graph-dock-placeholder')).hidden, true);
    assert.equal(outside.inert, false); assert.equal(body.style.overflow, 'auto');
    assert.equal(fixture.document.activeElement, expand);
    expand.dispatchEvent(new Event('click'));
    demo.setLanguage('he');
    assert.match(expand.textContent, /חזרה להדמיה/);
    media.matches = false; media.dispatchEvent(new Event('change'));
    assert.equal(hasClass('is-expanded')(graphs), false);
    assert.equal(hasClass('graphs-docked')(stage), false);
    assert.equal(expand.hidden, true);
    assert.equal(fixture.document.activeElement, checkbox);
    assert.equal(body.style.overflow, 'auto');
    media.matches = true; media.dispatchEvent(new Event('change'));
    expand.dispatchEvent(new Event('click'));
    demo.dispose(); demo = null;
    assert.equal(body.style.overflow, 'auto'); assert.equal(outside.inert, false);
  } finally { demo?.dispose(); fixture.cleanup(); }
});
