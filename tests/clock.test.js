import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../public/js/core/clock.js';
function fixture(duration = () => 3) {
  let next = 0; const pending = new Map(); const samples = [];
  const clock = createClock({ duration, onTick: (time, playing) => samples.push({ time, playing }), request: fn => { pending.set(++next, fn); return next; }, cancel: id => pending.delete(id) });
  const frame = now => { const list = [...pending.values()]; pending.clear(); list.forEach(fn => fn(now)); };
  return { clock, pending, samples, frame };
}
test('playback time is frame-rate independent', () => {
  for (const hz of [30, 60, 120]) {
    const f = fixture(); f.clock.play(); f.frame(0);
    for (let i = 1; i <= hz; i++) f.frame(i * 1000 / hz);
    assert.ok(Math.abs(f.clock.time - 1) < 1e-12);
  }
});
test('pause, reset and disposal cancel pending work', () => {
  const f = fixture(); f.clock.play(); f.frame(100); f.frame(600); f.clock.pause();
  assert.equal(f.clock.time, .5); assert.equal(f.pending.size, 0);
  f.frame(1500); assert.equal(f.clock.time, .5);
  f.clock.play(); f.frame(2000); f.frame(2500); assert.equal(f.clock.time, 1);
  f.clock.reset(); assert.equal(f.clock.time, 0); assert.equal(f.pending.size, 0);
  f.clock.play(); f.clock.dispose(); assert.equal(f.pending.size, 0);
  const count = f.samples.length; f.clock.play(); f.clock.step(); assert.equal(f.samples.length, count);
});
test('time stepping pauses playback and stops exactly at the duration', () => {
  const f = fixture(() => .12); f.clock.play(); f.clock.step(); f.clock.step(); f.clock.step();
  assert.equal(f.clock.time, .12); assert.equal(f.clock.playing, false); assert.equal(f.clock.ended, true); assert.equal(f.pending.size, 0);
  f.clock.play(); assert.equal(f.clock.time, 0); assert.equal(f.clock.playing, true);
});
test('slow motion scales simulated elapsed time and can change without a time jump', () => {
  const f = fixture(); f.clock.setRate(.25); f.clock.play(); f.frame(0); f.frame(1000); assert.equal(f.clock.time, .25);
  f.clock.setRate(1); f.frame(2000); f.frame(2500); assert.equal(f.clock.time, .75);
});
test('duration changes are respected on reset', () => {
  let duration = 2; const f = fixture(() => duration); f.clock.step(1); duration = .4; f.clock.reset(); f.clock.step(1);
  assert.equal(f.clock.time, .4); assert.equal(f.clock.ended, true);
});
