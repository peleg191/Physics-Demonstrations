import test from 'node:test';
import assert from 'node:assert/strict';
import { graphsSideBySide, chooseGraphWindow } from '../public/js/core/graph-window-layout.js';

const intersects = (a, b) => a.left < b.left + b.width && a.left + a.width > b.left
  && a.top < b.top + b.height && a.top + a.height > b.top;

test('horizontal layout requires enough space for every selected graph', () => {
  assert.equal(graphsSideBySide(1200, 1), false);
  assert.equal(graphsSideBySide(463, 2), false);
  assert.equal(graphsSideBySide(464, 2), true);
  assert.equal(graphsSideBySide(683, 3), false);
  assert.equal(graphsSideBySide(684, 3), true);
  assert.equal(graphsSideBySide(900, 0), false);
});

test('initial placement uses clear space beside a tall simulation', () => {
  const obstacles = [{ left: 440, top: 80, width: 320, height: 360 },
    { left: 10, top: 10, width: 260, height: 44 }, { left: 10, top: 470, width: 1180, height: 20 }];
  for (const count of [1, 2, 3]) {
    const result = chooseGraphWindow({ width: 1200, height: 500, count, obstacles });
    assert.ok(obstacles.every(o => !intersects(result, o)), JSON.stringify(result));
    assert.ok(result.width >= 220 && result.height >= 180);
    assert.ok(result.left >= 0 && result.top >= 0);
    assert.ok(result.left + result.width <= 1200 && result.top + result.height <= 500);
  }
});

test('a wide clear strip uses large horizontal graphs', () => {
  const obstacles = [{ left: 0, top: 0, width: 1000, height: 170 }];
  const result = chooseGraphWindow({ width: 1000, height: 500, count: 3, obstacles });
  assert.ok(graphsSideBySide(result.width, 3));
  assert.ok(!intersects(result, obstacles[0]));
});

test('small canvases remain usable even when avoiding all overlap is impossible', () => {
  for (const [width, height] of [[320, 360], [600, 220], [180, 150]]) {
    const result = chooseGraphWindow({ width, height, count: 3, obstacles: [{ left: 0, top: 0, width, height }] });
    assert.ok(result.width > 0 && result.height > 0);
    assert.ok(result.left >= 0 && result.top >= 0);
    assert.ok(result.left + result.width <= width && result.top + result.height <= height);
  }
});
