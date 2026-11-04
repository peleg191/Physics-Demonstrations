export const defaults = {
  stacked: { mass: 2, mu: 0.2, muBetween: 0.2, force: 20, speed: 0 },
  table: { mass1: 2, mass2: 3, angle: 30, mu: 0.2, speed: 0 },
  hanging: { mass1: 3, mass2: 3, angle: 30, mu: 0.2, speed: 0, direction: 1 },
};
// End before loss of support: 31.5 canvas pixels for 64 px blocks.
export const stackedSlipLimit = 0.75;
// For release from rest, the supplied surface coefficient also serves as its
// static limit. This explicit simulation assumption leaves moving-branch
// equations unchanged. Positive: bottom/table block right; slope block downhill.
export function solve(kind, p, g) {
  const speed = p.speed ?? 0;
  if (kind === 'stacked') {
    const normal = p.mass * g, groundNormal = 2 * normal;
    const resting = speed === 0 && p.force <= p.mu * groundNormal;
    const groundFriction = resting ? p.force : p.mu * groundNormal, limit = 3 * p.mu * normal;
    const threshold = 8 * p.mu * p.mass * g;
    const slipping = p.force > threshold + 1e-9;
    const muBetween = Math.max(0, Math.min(p.muBetween ?? p.mu, 3 * p.mu));
    const commonAcceleration = (p.force - groundFriction) / (2 * p.mass);
    const friction = slipping ? muBetween * normal : p.mass * commonAcceleration;
    const topAcceleration = friction / p.mass;
    const bottomAcceleration = (p.force - groundFriction - friction) / p.mass;
    return { normal, groundNormal, groundFriction, limit, threshold, muBetween, resting, velocity: speed,
      acceleration: bottomAcceleration, topAcceleration, bottomAcceleration,
      relativeAcceleration: bottomAcceleration - topAcceleration, friction, slipping };
  }
  const angle = p.angle * Math.PI / 180;
  const normal = (kind === 'table' ? p.mass1 : p.mass2 * Math.cos(angle)) * g;
  const drive = p.mass2 * g * Math.sin(angle) - (kind === 'hanging' ? p.mass1 * g : 0);
  const limit = p.mu * normal;
  const resting = speed === 0 && Math.abs(drive) <= limit + 1e-9;
  const direction = kind === 'table' ? 1 : speed > 0 ? p.direction : Math.sign(drive) || 1;
  const friction = resting ? Math.abs(drive) : limit;
  const acceleration = resting ? 0 : (drive - direction * friction) / (p.mass1 + p.mass2);
  const tension = kind === 'table' ? p.mass1 * acceleration + friction : p.mass1 * (g + acceleration);
  return { normal, friction, acceleration, tension, direction, resting, velocity: direction * speed };
}
export function endTime(kind, p, g) {
  const state = solve(kind, p, g);
  if (state.resting) return 4;
  const slipEnd = kind === 'stacked' && state.slipping ? Math.sqrt(2 * stackedSlipLimit / state.relativeAcceleration) : Infinity;
  const v = state.velocity, speed = Math.abs(v), direction = Math.sign(v) || Math.sign(state.acceleration) || 1;
  const stop = v * state.acceleration < 0 ? -v / state.acceleration : Infinity;
  const along = state.acceleration * direction, discriminant = speed * speed + 4 * along;
  const travel = discriminant >= 0 && (speed > 0 || along > 0) ? 4 / (Math.sqrt(discriminant) + speed) : Infinity;
  return Math.min(4, stop, travel, slipEnd);
}
export function sample(kind, p, time, g) {
  const state = solve(kind, p, g), t = Math.min(Math.max(0, time), endTime(kind, p, g));
  const initial = state.velocity;
  const position = initial * t + state.acceleration * t * t / 2, velocity = initial + state.acceleration * t;
  if (kind !== 'stacked') return { ...state, position, velocity };
  const topPosition = initial * t + state.topAcceleration * t * t / 2;
  return { ...state, position, velocity, bottomPosition: position, bottomVelocity: velocity,
    topPosition, topVelocity: initial + state.topAcceleration * t,
    relativeDisplacement: position - topPosition };
}
