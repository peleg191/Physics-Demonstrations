import { physicsConfig } from '../../config.js';

const g = physicsConfig.gravity;
const radians = degrees => degrees * Math.PI / 180;

export const defaults = {
  'energy-incline': { mass: 5, height: 5, angle: 30 },
  'escape-speed': { mass: 100, ratio: 1, planet: 'mars' },
  'spring-launcher': { mass: 2, stiffness: 80, compression: 0.5, angle: 30 },
};

const G = 6.67e-11;
export const planets = {
  mars: { mass: 6.42e23, radius: 3400e3 },
  earth: { mass: 5.97e24, radius: 6371e3 },
};

export function descent({ mass, height, angle }) {
  const alpha = radians(angle);
  const acceleration = g * Math.sin(alpha);
  const length = height / Math.sin(alpha);
  const duration = Math.sqrt(2 * length / acceleration);
  const total = mass * g * height;
  return { alpha, length, duration, finalSpeed: Math.sqrt(2 * g * height), sample(time) {
    const t = Math.min(time, duration);
    const position = t === duration ? length : acceleration * t ** 2 / 2;
    const velocity = acceleration * t;
    const y = Math.max(0, height - position * Math.sin(alpha));
    return { position, velocity, acceleration, x: position * Math.cos(alpha), y,
      kinetic: mass * velocity ** 2 / 2, potential: mass * g * y, total };
  } };
}

export function launcher({ mass, stiffness, compression, angle }) {
  const alpha = radians(angle);
  const omega = Math.sqrt(stiffness / mass);
  const release = Math.PI / (2 * omega);
  const finalSpeed = compression * omega;
  const rampStart = compression + 1;
  const rampTime = release + 1 / finalSpeed;
  const rampAcceleration = g * Math.sin(alpha);
  const duration = rampTime + finalSpeed / rampAcceleration;
  const total = stiffness * compression ** 2 / 2;
  const height = total / (mass * g);
  return { alpha, finalSpeed, height, rampStart, duration, sample(time) {
    let position, velocity, acceleration, remaining = 0;
    if (time < release) {
      remaining = compression * Math.cos(omega * time);
      position = compression - remaining;
      velocity = finalSpeed * Math.sin(omega * time);
      acceleration = omega ** 2 * remaining;
    } else if (time < rampTime) {
      position = compression + finalSpeed * (time - release);
      velocity = finalSpeed;
      acceleration = 0;
    } else {
      const elapsed = Math.min(time - rampTime, finalSpeed / rampAcceleration);
      position = rampStart + elapsed * (finalSpeed - rampAcceleration * elapsed / 2);
      velocity = time >= duration ? 0 : finalSpeed - rampAcceleration * elapsed;
      acceleration = -rampAcceleration;
    }
    const climb = Math.max(0, position - rampStart);
    const y = climb * Math.sin(alpha);
    const elastic = stiffness * remaining ** 2 / 2;
    const gravitational = mass * g * y;
    return { position, velocity, acceleration, x: position - climb + climb * Math.cos(alpha), y, remaining,
      kinetic: mass * velocity ** 2 / 2, elastic, gravitational, potential: elastic + gravitational, total };
  } };
}

export function escape({ mass, planet, ratio }) {
  const { mass: planetMass, radius } = planets[planet];
  const mu = G * planetMass;
  const escapeSpeed = Math.sqrt(2 * mu / radius);
  const energy = (ratio ** 2 - 1) * mu / radius;
  const turn = energy < 0 ? -mu / energy : Infinity;
  const limit = Math.min(turn, 5 * radius);
  const turnsInView = turn <= 5 * radius;

  // Radial Kepler time of flight. The trigonometric branch includes the
  // finite turning point and the parabolic branch handles exact escape.
  let flightTime;
  if (energy === 0) {
    flightTime = r => 2 * (r ** 1.5 - radius ** 1.5) / (3 * Math.sqrt(2 * mu));
  } else {
    const a = mu / (2 * Math.abs(energy));
    const scale = Math.sqrt(a ** 3 / mu);
    const primitive = energy < 0
      ? r => { const u = 2 * Math.asin(Math.sqrt(Math.min(1, r / (2 * a)))); return u - Math.sin(u); }
      : r => { const u = 2 * Math.asinh(Math.sqrt(r / (2 * a))); return Math.sinh(u) - u; };
    const start = primitive(radius);
    flightTime = r => scale * (primitive(r) - start);
  }
  const duration = flightTime(limit);
  const energyScale = mass * mu / radius * Math.max(1, ratio ** 2);
  return { radius, escapeSpeed, energy, energyScale, turnsInView, duration, sample(time) {
    let low = radius;
    let high = limit;
    for (let i = 0; i < 40 && time > 0 && time < duration; i++) {
      const middle = (low + high) / 2;
      if (flightTime(middle) < time) low = middle;
      else high = middle;
    }
    const position = time <= 0 ? radius : time >= duration ? limit : (low + high) / 2;
    const velocity = time >= duration && turnsInView ? 0 : Math.sqrt(Math.max(0, 2 * (energy + mu / position)));
    return { position, velocity, acceleration: -mu / position ** 2,
      kinetic: mass * velocity ** 2 / 2, potential: -mass * mu / position, total: mass * energy };
  } };
}
