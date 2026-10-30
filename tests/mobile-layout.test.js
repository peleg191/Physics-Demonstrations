import test from 'node:test';
import assert from 'node:assert/strict';
import { browserFixture } from './dom-fixture.js';
import { demonstrations } from '../public/js/registry.js';
import { createBodyAnalysis } from '../public/js/core/body-analysis.js';

const hasClass = name => node => node.className.split(' ').includes(name);

test('mobile graphs follow playback controls and return to the stage on desktop', async () => {
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
        assert.equal(graphs.parentNode, column);
        assert.equal(transport.parentNode, stage);
        assert.equal(transport.children.filter(node => node.tagName === 'button').length, 3);
        assert.ok(column.children.indexOf(graphs) > column.children.indexOf(stage));
        media.matches = false; media.dispatchEvent(new Event('change'));
        assert.equal(graphs.parentNode, stage);
        media.matches = true; media.dispatchEvent(new Event('change'));
        assert.equal(graphs.parentNode, column);
        assert.equal(column.children.filter(node => node === graphs).length, 1);
      } finally { demo.dispose(); }
    }
  } finally { globalThis.matchMedia = originalMedia; fixture.cleanup(); }
});

test('mobile analysis reveals once per opening and restores the previous scroll position', () => {
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
    assert.equal(reveals, 1);
    assert.equal(fixture.document.activeElement, title);
    analysis.update({ ...data, axis: 'y' }); fixture.frame(10);
    assert.equal(reveals, 1);
    analysis.hide();
    assert.equal(scrolls.length, 1);
    assert.equal(scrolls[0].top, globalThis.scrollY ?? 0);
    analysis.update(data); analysis.hide(); fixture.frame(20);
    assert.equal(reveals, 1);
    analysis.update(data); fixture.frame(30);
    assert.equal(reveals, 2);
  } finally {
    controller.abort(); globalThis.matchMedia = originalMedia;
    if (originalScroll === undefined) delete globalThis.scrollTo; else globalThis.scrollTo = originalScroll;
    fixture.cleanup();
  }
});
