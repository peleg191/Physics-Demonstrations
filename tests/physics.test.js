import test from 'node:test';
import assert from 'node:assert/strict';
import { projectileState, flightDuration, hoopCrossing, shotOutcome, shotTolerance } from '../public/js/demos/basketball/physics.js';
import { pulleyForces, pulleyState, travelDuration, travelLimit } from '../public/js/demos/pulley/physics.js';
const close = (actual, expected, eps = 1e-9) => assert.ok(Math.abs(actual - expected) < eps, `${actual} ≠ ${expected}`);
const shot = { speed: Math.sqrt(40), angle: 45, releaseHeight: 2.5, hoopHeight: 2.5, distance: 4 };

test('basketball reaches the descending hoop at the reference launch speed', () => {
  const hoop = hoopCrossing(shot, 10);
  close(hoop.time, Math.sqrt(.8)); close(hoop.x, 4); close(hoop.y, 2.5);
  assert.ok(hoop.vy < 0); assert.equal(shotOutcome(shot, 10).key, 'score');
});
test('projectile apex, independence of components and conservation of energy', () => {
  const initial = projectileState(shot, 0, 10);
  const apex = projectileState(shot, initial.vy / 10, 10);
  close(apex.vy, 0); close(apex.ay, -10); close(apex.vx, initial.vx);
  for (const time of [0, .1, .5, 1]) {
    const state = projectileState(shot, time, 10);
    close((state.vx ** 2 + state.vy ** 2) / 2 + 10 * state.y, shot.speed ** 2 / 2 + 10 * shot.releaseHeight);
  }
});
test('flight terminates at ground for different release heights and gravity', () => {
  for (const gravity of [3.7, 9.81, 10, 20]) for (const releaseHeight of [.5, 2.5, 5]) {
    const p = { ...shot, releaseHeight };
    close(projectileState(p, flightDuration(p, gravity), gravity).y, 0);
  }
});
test('shot feedback distinguishes above, below, short and rising crossings', () => {
  assert.equal(shotOutcome({ ...shot, speed: 8 }, 10).key, 'high');
  assert.equal(shotOutcome({ ...shot, speed: 5.5 }, 10).key, 'low');
  assert.equal(shotOutcome({ ...shot, speed: 1 }, 10).key, 'short');
  const rising = { ...shot, distance: 1, hoopHeight: projectileState(shot, 1 / projectileState(shot, 0, 10).vx, 10).y };
  assert.equal(shotOutcome(rising, 10).key, 'rising');
  assert.ok(shotTolerance > 0 && shotTolerance < .2);
});
test('gravity is supplied explicitly to projectile calculations', () => {
  const state = projectileState(shot, .5, 3.7);
  close(state.ay, -3.7); assert.ok(state.y > projectileState(shot, .5, 10).y);
});
test('equal pulley masses released from rest remain static', () => {
  const params = { mass1: 10, mass2: 10 };
  assert.deepEqual(pulleyForces(params, 10), { acceleration: 0, tension: 100 });
  for (const time of [0, 1, 4, 100]) { const state = pulleyState(params, time, 10); close(state.left, 0); close(state.right, 0); close(state.velocity, 0); }
});
test('pulley acceleration and tension satisfy Newton’s second law for both masses', () => {
  for (const gravity of [3.7, 9.81, 10]) for (const [mass1, mass2] of [[10, 5], [3, 30], [10, 10]]) {
    const { acceleration: a, tension: T } = pulleyForces({ mass1, mass2 }, gravity);
    close(mass1 * gravity - T, mass1 * a);
    close(T - mass2 * gravity, mass2 * a);
  }
});
test('swapping masses reverses acceleration and preserves rope length and tension', () => {
  const a = { mass1: 10, mass2: 4 }, b = { mass1: 4, mass2: 10 };
  const f1 = pulleyForces(a, 10), f2 = pulleyForces(b, 10);
  close(f1.acceleration, -f2.acceleration); close(f1.tension, f2.tension);
  for (const time of [0, .1, .2, .3]) {
    const state = pulleyState(a, time, 10);
    close(state.left + state.right, 0); assert.ok(state.left >= 0 && state.right <= 0);
  }
});
test('pulley stops at the same travel limit for different masses and gravity', () => {
  for (const params of [{ mass1: 30, mass2: 1 }, { mass1: 9.5, mass2: 10 }]) for (const gravity of [9.81, 10, 3.7]) {
    const duration = travelDuration(params, gravity);
    close(Math.abs(pulleyState(params, duration, gravity).displacement), travelLimit);
    close(Math.abs(pulleyState(params, duration + 10, gravity).displacement), travelLimit);
  }
});
