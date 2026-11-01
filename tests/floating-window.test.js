import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
setMaxListeners(0);
import { browserFixture } from './dom-fixture.js';
import { attachFloatingWindow } from '../public/js/core/floating-window.js';

const pointer = (type, x, y) => {
  const event = new Event(type, { cancelable: true });
  Object.assign(event, { button: 0, pointerId: 1, clientX: x, clientY: y });
  return event;
};

test('floating window moves, resizes, and stays within the canvas after a viewport change', () => {
  const fixture = browserFixture(), controller = new AbortController();
  try {
    const parent = fixture.root;
    let width = 600, height = 400;
    parent.getBoundingClientRect = () => ({ left: 100, top: 50, width, height });
    const root = fixture.document.createElement('section');
    const handle = fixture.document.createElement('button'), resize = fixture.document.createElement('button');
    root.append(handle, resize); parent.append(root);
    for (const node of [handle, resize]) node.setPointerCapture = () => {};
    root.getBoundingClientRect = () => ({
      left: 100 + parseFloat(root.style.left), top: 50 + parseFloat(root.style.top),
      width: parseFloat(root.style.width), height: parseFloat(root.style.height),
    });
    const floating = attachFloatingWindow({ root, parent, handle, resize, signal: controller.signal });
    Object.assign(root.style, { left: '50px', top: '40px', width: '300px', height: '200px' });
    handle.dispatchEvent(pointer('pointerdown', 160, 100));
    handle.dispatchEvent(pointer('pointermove', 1000, 1000));
    assert.equal(root.style.left, '300px'); assert.equal(root.style.top, '200px');
    handle.dispatchEvent(pointer('pointerup', 1000, 1000));
    resize.dispatchEvent(pointer('pointerdown', 0, 0));
    resize.dispatchEvent(pointer('pointermove', 900, 900));
    assert.equal(root.style.width, '600px'); assert.equal(root.style.height, '400px');
    assert.equal(root.style.left, '0px'); assert.equal(root.style.top, '0px');
    resize.dispatchEvent(pointer('pointercancel', 900, 900));
    width = 280; height = 200; floating.fit();
    assert.equal(root.style.width, '280px'); assert.equal(root.style.height, '200px');
    const key = new Event('keydown', { cancelable: true }); Object.defineProperty(key, 'key', { value: 'ArrowLeft' });
    resize.dispatchEvent(key);
    assert.equal(root.style.width, '270px');
    controller.abort();
    resize.dispatchEvent(pointer('pointerdown', 0, 0)); resize.dispatchEvent(pointer('pointermove', 100, 100));
    assert.equal(root.style.width, '');
    floating.fit();
    assert.equal(root.style.width, '');
  } finally { controller.abort(); fixture.cleanup(); }
});

test('automatic placement adapts until the user moves or resizes the window', () => {
  const fixture = browserFixture(), controller = new AbortController();
  try {
    const parent = fixture.root;
    parent.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 500 });
    const root = fixture.document.createElement('section');
    const handle = fixture.document.createElement('button'), resize = fixture.document.createElement('button');
    root.append(handle, resize); parent.append(root);
    let initial = { left: 400, top: 80, width: 320, height: 280 };
    root.getBoundingClientRect = () => Object.fromEntries(['left', 'top', 'width', 'height'].map(key => [key, parseFloat(root.style[key]) || 0]));
    const sizes = [];
    const floating = attachFloatingWindow({ root, parent, handle, resize, signal: controller.signal,
      initialGeometry: () => initial, onChange: (w, h) => sizes.push([w, h]) });
    floating.fit(); assert.equal(root.style.left, '400px');
    initial = { ...initial, left: 100, width: 500 }; floating.fit();
    assert.equal(root.style.left, '100px'); assert.deepEqual(sizes.at(-1), [500, 280]);
    const key = new Event('keydown', { cancelable: true }); Object.defineProperty(key, 'key', { value: 'ArrowRight' });
    handle.dispatchEvent(key); assert.equal(root.style.left, '110px');
    initial = { ...initial, left: 0, width: 300 }; floating.fit();
    assert.equal(root.style.left, '110px'); assert.equal(root.style.width, '500px');
  } finally { controller.abort(); fixture.cleanup(); }
});

test('a reused window discards previous geometry and ignores queued fitting after disposal', () => {
  const fixture = browserFixture(), controller = new AbortController();
  try {
    const root = fixture.document.createElement('section');
    const handle = fixture.document.createElement('button'), resize = fixture.document.createElement('button');
    Object.assign(root.style, { left: '400px', top: '100px', width: '700px', height: '350px' });
    fixture.root.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 500 });
    const floating = attachFloatingWindow({ root, parent: fixture.root, handle, resize, signal: controller.signal,
      initialGeometry: () => ({ left: 20, top: 60, width: 300, height: 240 }) });
    assert.equal(root.style.width, '');
    floating.fit();
    assert.equal(root.style.left, '20px'); assert.equal(root.style.width, '300px');
    controller.abort(); floating.fit();
    assert.equal(root.style.left, ''); assert.equal(root.style.width, '');
  } finally { controller.abort(); fixture.cleanup(); }
});

test('docked and expanded windows ignore floating movement and fitting', () => {
  const fixture = browserFixture(), controller = new AbortController();
  try {
    const root = fixture.document.createElement('section');
    const handle = fixture.document.createElement('button'), resize = fixture.document.createElement('button');
    const floating = attachFloatingWindow({ root, parent: fixture.root, handle, resize, signal: controller.signal, enabled: () => false });
    handle.dispatchEvent(pointer('pointerdown', 10, 10));
    const key = new Event('keydown', { cancelable: true }); Object.defineProperty(key, 'key', { value: 'ArrowRight' });
    resize.dispatchEvent(key); floating.fit();
    assert.equal(key.defaultPrevented, false);
    assert.equal(root.style.width, ''); assert.equal(root.style.left, '');
  } finally { controller.abort(); fixture.cleanup(); }
});
