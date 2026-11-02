export const defaultParameters = Object.freeze({ mass: 60, acceleration: 2 });
export const duration = 4;
// Upward is positive. Stop sampling at the observation cutoff, without modeling a stop.
export function elevatorState(params, time, gravity) {
  const t = Math.max(0, Math.min(time, duration));
  const acceleration = Math.max(-gravity, params.acceleration);
  const weight = params.mass * gravity;
  const normal = params.mass * (gravity + acceleration);
  return { mass: params.mass, gravity, acceleration, weight, normal, netForce: params.mass * acceleration,
    position: 0.5 * acceleration * t * t, velocity: acceleration * t };
}
