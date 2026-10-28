export const shotTolerance = 0.12; // Vertical distance (m) at the hoop's x coordinate.
export const defaultParameters = Object.freeze({ speed: 6.3, angle: 45, releaseHeight: 2.5, hoopHeight: 2.5, distance: 4 });
export function velocityComponents({ speed, angle }) {
  const theta = angle * Math.PI / 180;
  return { vx: speed * Math.cos(theta), vy: speed * Math.sin(theta) };
}
export function projectileState(params, time, gravity) {
  const { vx, vy } = velocityComponents(params);
  return { x: vx * time, y: params.releaseHeight + vy * time - gravity * time ** 2 / 2, vx, vy: vy - gravity * time, ax: 0, ay: -gravity };
}
export function flightDuration(params, gravity) {
  const { vy } = velocityComponents(params);
  return (vy + Math.sqrt(vy ** 2 + 2 * gravity * params.releaseHeight)) / gravity;
}
export function hoopCrossing(params, gravity) {
  const { vx } = velocityComponents(params);
  const time = params.distance / vx;
  const state = projectileState(params, time, gravity);
  return { ...state, time, difference: state.y - params.hoopHeight, reachable: time <= flightDuration(params, gravity) };
}
export function shotOutcome(params, gravity) {
  const crossing = hoopCrossing(params, gravity);
  if (!crossing.reachable) return { key: 'short', ...crossing };
  if (Math.abs(crossing.difference) <= shotTolerance) return { key: crossing.vy < 0 ? 'score' : 'rising', ...crossing };
  return { key: crossing.difference > 0 ? 'high' : 'low', ...crossing };
}
