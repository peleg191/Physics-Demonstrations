export const defaultParameters = Object.freeze({ mass: 1, length: 2, amplitude: 10 });
export function oscillatorState(params, time, gravity) {
  const omega = Math.sqrt(gravity / params.length), amplitude = params.amplitude * Math.PI / 180;
  const position = amplitude * Math.cos(omega * time), velocity = -amplitude * omega * Math.sin(omega * time);
  return { omega, period: 2 * Math.PI / omega, position, velocity, acceleration: -(omega ** 2) * position,
    kinetic: 0.5 * params.mass * (params.length * velocity) ** 2,
    potential: 0.5 * params.mass * gravity * params.length * position ** 2 };
}
export const duration = (params, gravity) => 4 * oscillatorState(params, 0, gravity).period;
