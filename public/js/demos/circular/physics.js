// Models use SI units. Circular support limits are checked before showing a steady orbit.
export const defaults = Object.freeze({
  'rotating-tube': Object.freeze({ mass: 1, radius: 1, friction: 0.2, frequency: 0.2 }),
  'two-string': Object.freeze({ mass: 1, length: 1, separation: 1, frequency: 1 }),
  'energy-bowl': Object.freeze({ mass: 1, radius: 1, releaseAngle: 90 }),
});
export function tubeState(params, time, gravity = 10) {
  const omega = 2 * Math.PI * params.frequency, required = params.mass * omega ** 2 * params.radius;
  const weight = params.mass * gravity, limit = params.friction * weight;
  const valid = required <= limit + 1e-10;
  // The tube constrains angular motion. During outward sliding, use μ_k = μ_s.
  // r'' = ω²r − μ_k g; stop at the open end shown in the diagram.
  const equilibrium = omega ? params.friction * gravity / omega ** 2 : 0;
  const endRadius = params.radius * 183 / 140;
  const exitTime = valid ? Infinity : Math.acosh((endRadius - equilibrium) / (params.radius - equilibrium)) / omega;
  const elapsed = Math.max(0, Math.min(time, exitTime));
  const phase = omega * elapsed;
  const radius = valid ? params.radius : equilibrium + (params.radius - equilibrium) * Math.cosh(omega * elapsed);
  const radialSpeed = valid ? 0 : omega * (params.radius - equilibrium) * Math.sinh(omega * elapsed);
  const radialAcceleration = valid ? 0 : omega ** 2 * radius - params.friction * gravity;
  const cosine = Math.cos(phase), sine = Math.sin(phase);
  return { valid, phase, omega, weight, normal: weight, required, limit,
    radius, radialSpeed, exitTime, frictionForce: valid ? required : limit,
    wallForce: 2 * params.mass * omega * radialSpeed,
    speed: Math.hypot(radialSpeed, omega * radius),
    maximumFrequency: Math.sqrt(params.friction * gravity / params.radius) / (2 * Math.PI),
    maximumRadius: omega ? equilibrium : Infinity, period: 1 / params.frequency,
    position: radius * cosine,
    velocity: radialSpeed * cosine - omega * radius * sine,
    acceleration: (radialAcceleration - omega ** 2 * radius) * cosine - 2 * omega * radialSpeed * sine };

}
export function twoStringState(params, time, gravity = 10) {
  const { mass, length, separation, frequency } = params;
  const geometryValid = length > 0 && separation > 0 && separation < 2 * length;
  const radius = geometryValid ? Math.sqrt(length ** 2 - separation ** 2 / 4) : 0;
  const alpha = geometryValid ? Math.asin(separation / (2 * length)) : 0;
  const omega = 2 * Math.PI * frequency, weight = mass * gravity;
  const sum = mass * omega ** 2 * length, difference = geometryValid ? 2 * mass * gravity * length / separation : Infinity;
  const upper = (sum + difference) / 2, lower = (sum - difference) / 2;
  const valid = geometryValid && lower >= -1e-10;
  const phase = valid ? omega * time : 0;
  return { valid, radius, alpha, phase, omega, upper, lower, weight, speed: omega * radius, period: 1 / frequency,
    minimumFrequency: Math.sqrt(2 * gravity / separation) / (2 * Math.PI),
    position: radius * Math.cos(phase), velocity: valid ? -omega * radius * Math.sin(phase) : 0,
    acceleration: valid ? -(omega ** 2) * radius * Math.cos(phase) : 0 };
}

// A dimensionless quarter-orbit table resolves the full pendulum equation, including
// a release at the rim. It is independent of mass, radius and frame rate.
const trajectories = new Map();
function bowlTrajectory(degrees) {
  if (trajectories.has(degrees)) return trajectories.get(degrees);
  const amplitude = degrees * Math.PI / 180, count = 1024;
  let a = 1, b = Math.cos(amplitude / 2);
  for (let i = 0; i < 12; i++) { const next = (a + b) / 2; b = Math.sqrt(a * b); a = next; }
  const quarter = Math.PI / (2 * a), step = quarter / count, angles = [amplitude];
  let theta = amplitude, speed = 0;
  for (let i = 0; i < count; i++) {
    const k1x = speed, k1v = -Math.sin(theta);
    const k2x = speed + step * k1v / 2, k2v = -Math.sin(theta + step * k1x / 2);
    const k3x = speed + step * k2v / 2, k3v = -Math.sin(theta + step * k2x / 2);
    const k4x = speed + step * k3v, k4v = -Math.sin(theta + step * k3x);
    theta += step / 6 * (k1x + 2 * k2x + 2 * k3x + k4x);
    speed += step / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
    angles.push(Math.max(0, theta));
  }
  angles[count] = 0;
  const at = fraction => {
    const index = Math.max(0, Math.min(count, fraction * count)), left = Math.min(count - 1, Math.floor(index));
    return angles[left] + (angles[left + 1] - angles[left]) * (index - left);
  };
  const trajectory = { quarter, at }; trajectories.set(degrees, trajectory); return trajectory;
}
export function bowlState(params, time, gravity = 10) {
  const { mass, radius, releaseAngle } = params, amplitude = releaseAngle * Math.PI / 180;
  const trajectory = bowlTrajectory(releaseAngle), quarter = trajectory.quarter * Math.sqrt(radius / gravity);
  const phase = ((time / quarter) % 4 + 4) % 4, quadrant = Math.floor(phase);
  const theta = quadrant === 0 ? trajectory.at(phase) : quadrant === 1 ? -trajectory.at(2 - phase)
    : quadrant === 2 ? -trajectory.at(phase - 2) : trajectory.at(4 - phase);
  const cosine = Math.cos(theta), sine = Math.sin(theta);
  const total = mass * gravity * radius * (1 - Math.cos(amplitude));
  const potential = mass * gravity * radius * (1 - cosine), kinetic = Math.max(0, total - potential);
  const speed = Math.sqrt(2 * kinetic / mass), angularVelocity = (quadrant < 2 ? -1 : 1) * speed / radius;
  const angularAcceleration = -gravity / radius * sine;
  const centripetal = speed ** 2 / radius, tangential = -gravity * sine;
  return { valid: true, theta, angularVelocity, angularAcceleration, speed, quarter, period: 4 * quarter,
    total, potential, kinetic, height: radius * (1 - cosine), normal: mass * (centripetal + gravity * cosine), weight: mass * gravity,
    centripetal, tangential, position: radius * sine, velocity: radius * cosine * angularVelocity,
    acceleration: radius * cosine * angularAcceleration - radius * sine * angularVelocity ** 2 };
}
export const models = { 'rotating-tube': tubeState, 'two-string': twoStringState, 'energy-bowl': bowlState };
export function duration(kind, params, gravity = 10) {
  if (kind === 'rotating-tube') { const state = tubeState(params, 0, gravity); if (!state.valid) return state.exitTime; }
  return (kind === 'energy-bowl' ? 2 : 4) * models[kind](params, 0, gravity).period; }
