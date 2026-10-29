export const defaultParameters = Object.freeze({ mass: 3, angle: 30, staticFriction: 0.2, kineticFriction: 0.1 });
export const travelLength = 4;
export function inclineForces(params, gravity) {
  const { mass, angle, staticFriction, kineticFriction } = params;
  const alpha = angle * Math.PI / 180;
  const weight = mass * gravity, normal = weight * Math.cos(alpha), downhill = weight * Math.sin(alpha);
  const staticLimit = staticFriction * normal;
  const resting = downhill <= staticLimit + 1e-12 * weight;
  const friction = resting ? downhill : kineticFriction * normal;
  return { weight, normal, downhill, staticLimit, resting, friction, acceleration: resting ? 0 : (downhill - friction) / mass,
    criticalAngle: Math.atan(staticFriction) * 180 / Math.PI };
}
export function travelDuration(params, gravity) {
  const { acceleration } = inclineForces(params, gravity);
  return acceleration > 0 ? Math.sqrt(2 * travelLength / acceleration) : 4;
}
export function inclineState(params, time, gravity) {
  const forces = inclineForces(params, gravity);
  const t = Math.max(0, Math.min(time, travelDuration(params, gravity)));
  return { ...forces, displacement: forces.acceleration * t * t / 2, velocity: forces.acceleration * t };
}
