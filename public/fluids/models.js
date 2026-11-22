export const g = 10; // The lecture examples use 10 m/s².

export function hydraulic({ force, inputArea, outputArea, mass }) {
  const pressure = force / (inputArea * 1e-4);
  const outputForce = pressure * outputArea * 1e-4;
  return { pressure, outputForce, net: outputForce - mass * g };
}

export function buoyancy({ liquidDensity, blockDensity, volume, immersion, onBottom = false }) {
  const displaced = volume * immersion;
  const upward = liquidDensity * displaced * 1e-3 * g;
  const weight = blockDensity * volume * 1e-3 * g;
  const support = onBottom ? Math.max(0, weight - upward) : 0;
  return { displaced, upward, weight, support, net: upward + support - weight, immersion, densityRatio: blockDensity / liquidDensity };
}

// Position measures the depth of the block’s bottom in block heights.
export const buoyancyFloor = 162 / 84;
const blockHeight = 0.2; // The schematic uses a fixed height and varies volume through cross-section.
export const submergedFraction = position => Math.max(0, Math.min(1, position));

export function advanceBuoyancy(motion, { liquidDensity, blockDensity }, duration) {
  const ratio = blockDensity / liquidDensity;
  const steps = Math.max(1, Math.ceil(duration * 120));
  const dt = duration / steps;
  let { position, velocity } = motion;
  for (let i = 0; i < steps; i++) {
    const acceleration = g / blockHeight * (1 - submergedFraction(position) / ratio) - 10 * velocity;
    velocity += acceleration * dt;
    position += velocity * dt;
    if (position >= buoyancyFloor) {
      position = buoyancyFloor;
      velocity = Math.min(0, velocity);
    }
  }
  if (Math.abs(velocity) < 0.003) {
    if (ratio < 1 && Math.abs(position - ratio) < 0.001) return { position: ratio, velocity: 0, settled: true };
    if (ratio === 1 && position >= 1) return { position, velocity: 0, settled: true };
    if (ratio > 1 && position === buoyancyFloor) return { position, velocity: 0, settled: true, onBottom: true };
  }
  return { position, velocity };
}

export function tank({ depth, areaRatio }) {
  const speed = Math.sqrt(2 * g * depth / (1 - 1 / areaRatio ** 2));
  return { speed, surfaceSpeed: speed / areaRatio, approximation: Math.sqrt(2 * g * depth) };
}

export function drainDepth(initialDepth, areaRatio, elapsed) {
  // dh/dt = −v₂/(A₁/A₂), integrated with the outlet fixed at h = 0.
  const root = Math.sqrt(initialDepth) - elapsed * Math.sqrt(g / (2 * (areaRatio ** 2 - 1)));
  return Math.max(0, root) ** 2;
}

export const pipeInletRadius = 0.10;
export const waterDensity = 1000;

export function pipeFlow({ radius2, speed1, pressure1, drop = 0 }) {
  const area1 = Math.PI * pipeInletRadius ** 2;
  const area2 = Math.PI * radius2 ** 2;
  const flowRate = area1 * speed1;
  const speed2 = flowRate / area2;
  const kineticChange = waterDensity * (speed1 ** 2 - speed2 ** 2) / 2;
  const elevationChange = waterDensity * g * drop;
  const pressureChange = kineticChange + elevationChange;
  return {
    area1, area2, flowRate, speed2, kineticChange, elevationChange, pressureChange,
    pressure2: pressure1 * 1000 + pressureChange,
  };
}
