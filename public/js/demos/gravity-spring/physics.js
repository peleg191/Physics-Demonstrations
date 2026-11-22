import { oscillatorState } from '../spring/physics.js';

export function gravitySpringState(params, time, gravity) {
  const state = oscillatorState(params, time);
  const alongAxis = params.angle === undefined ? 1 : Math.sin(params.angle * Math.PI / 180);
  const gravityForce = params.mass * gravity * alongAxis;
  const shift = gravityForce / params.stiffness;
  const extension = shift + state.position;
  // Zero gravitational potential at the lowest turning point.
  const gravitational = gravityForce * (Math.abs(params.amplitude) - state.position);
  return { ...state, shift, extension, gravitational, elastic: 0.5 * params.stiffness * extension ** 2,
    total: state.total + 0.5 * params.stiffness * shift ** 2 + gravityForce * Math.abs(params.amplitude) };
}
