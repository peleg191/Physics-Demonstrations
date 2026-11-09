export const defaultParameters = Object.freeze({ mass: 2, radius: 1, angle: 45 });
export function carouselState(params, time, gravity = 10) {
  const alpha = params.angle * Math.PI / 180;
  const acceleration = gravity * Math.tan(alpha);
  const speed = Math.sqrt(params.radius * acceleration), omega = speed / params.radius;
  const phase = omega * time;
  return { speed, omega, phase, period: 2 * Math.PI / omega, acceleration,
    tension: params.mass * gravity / Math.cos(alpha), length: params.radius / Math.sin(alpha),
    height: params.radius / Math.tan(alpha), weight: params.mass * gravity,
    position: [params.radius * Math.cos(phase), params.radius * Math.sin(phase)],
    velocity: [-speed * Math.sin(phase), speed * Math.cos(phase)],
    accelerations: [-acceleration * Math.cos(phase), -acceleration * Math.sin(phase)] };
}
export const duration = (params, gravity) => 4 * carouselState(params, 0, gravity).period;
