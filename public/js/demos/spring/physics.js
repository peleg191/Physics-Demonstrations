export const defaultParameters = Object.freeze({ mass: 2, stiffness: 20, amplitude: 0.6 });
export function oscillatorState(params, time) {
  const omega = Math.sqrt(params.stiffness / params.mass);
  const position = params.amplitude * Math.cos(omega * time), velocity = -params.amplitude * omega * Math.sin(omega * time);
  return { omega, period: 2 * Math.PI / omega, position, velocity, acceleration: -(omega ** 2) * position,
    kinetic: 0.5 * params.mass * velocity ** 2, potential: 0.5 * params.stiffness * position ** 2 };
}
export const duration = params => 4 * oscillatorState(params, 0).period;
