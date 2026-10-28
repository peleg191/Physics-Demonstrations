export const defaultParameters = Object.freeze({ mass1: 10, mass2: 10 });
export const travelLimit = 1.25; // m, measured from the initial position of each mass.
export function pulleyForces({ mass1, mass2 }, gravity) {
  return { acceleration: (mass1 - mass2) * gravity / (mass1 + mass2), tension: 2 * mass1 * mass2 * gravity / (mass1 + mass2) };
}
export function travelDuration(params, gravity) {
  const { acceleration } = pulleyForces(params, gravity);
  return acceleration === 0 ? 4 : Math.sqrt(2 * travelLimit / Math.abs(acceleration));
}
export function pulleyState(params, time, gravity) {
  const { acceleration, tension } = pulleyForces(params, gravity);
  const clamped = Math.min(time, travelDuration(params, gravity));
  const displacement = acceleration * clamped ** 2 / 2;
  return { displacement, left: displacement, right: -displacement, velocity: acceleration * clamped, acceleration, tension };
}
