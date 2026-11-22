import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, descent, escape, launcher } from '../public/js/demos/energy/physics.js';

function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-8 * Math.max(1, Math.abs(expected)), `${actual} differs from ${expected}`);
}
function checkEnergy(model) {
  for (let i = 0; i <= 20; i++) {
    const { kinetic, potential, total } = model.sample(i * model.duration / 20);
    near((kinetic + potential - total) / Math.max(1, kinetic, Math.abs(potential)), 0);
  }
}

test('the frictionless worksheet block reaches 10 m/s independent of mass and angle', () => {
  const params = defaults['energy-incline'];
  for (const angle of [15, 30, 65]) {
    const model = descent({ ...params, angle, mass: angle / 5 });
    checkEnergy(model);
    near(model.sample(model.duration).y, 0);
    near(model.sample(model.duration).velocity, 10);
  }
});

test('radial launches conserve signed energy below, at, and above escape speed', () => {
  for (const planet of ['mars', 'earth']) {
    for (const ratio of [0.4, 0.8, 0.9, 0.99, 1, 1.01, 1.5]) {
      const model = escape({ ...defaults['escape-speed'], planet, ratio });
      assert.ok(model.duration > 0 && Number.isFinite(model.duration));
      checkEnergy(model);
      assert.equal(Math.sign(model.energy), Math.sign(ratio - 1));
      near(model.sample(0).velocity, model.escapeSpeed * ratio);
      const end = model.sample(model.duration);
      if (model.turnsInView) near(end.velocity, 0);
      else near(end.position, 5 * model.radius);
    }
  }
  near(escape(defaults['escape-speed']).escapeSpeed, 5018.870273630253);
});

test('the spring relaxes before the block climbs, preserving energy across both transitions', () => {
  const params = defaults['spring-launcher'];
  for (const angle of [15, 30, 65]) {
    const model = launcher({ ...params, angle });
    const release = Math.PI / (2 * Math.sqrt(params.stiffness / params.mass));
    checkEnergy(model);
    const start = model.sample(0), separated = model.sample(release), peak = model.sample(model.duration);
    near(start.elastic, start.total);
    near(start.kinetic, 0);
    near(start.gravitational, 0);
    near(separated.elastic, 0);
    near(separated.kinetic, separated.total);
    near(separated.gravitational, 0);
    near(separated.velocity, model.finalSpeed);
    near(peak.elastic, 0);
    near(peak.kinetic, 0);
    near(peak.gravitational, peak.total);
    near(peak.y, 0.5);
  }
});
