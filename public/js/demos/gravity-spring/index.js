import { mountOscillator } from '../../core/oscillator.js';
import { duration } from '../spring/physics.js';
import { gravitySpringState } from './physics.js';
import { createGravitySpringScene } from './scene.js';
import { gravitySpringStrings } from './strings.js';

export function mountGravitySpring(kind, options) {
  const inclined = kind === 'incline-spring';
  return mountOscillator({ ...options, kind, strings: gravitySpringStrings(inclined), oscillatorState: gravitySpringState, duration,
    shiftedScene: svg => createGravitySpringScene(svg, inclined),
    defaultParameters: { mass: 5, stiffness: 40, amplitude: 0.55, ...(inclined ? { angle: 35 } : {}) },
    specs: [
      { key: 'mass', symbol: 'm', min: 1, max: 15, step: 0.5, unit: 'kg' },
      { key: 'stiffness', symbol: 'k', min: 35, max: 100, step: 1, unit: 'N/m' },
      ...(inclined ? [{ key: 'angle', symbol: 'θ', min: 0, max: 65, step: 1, unit: '°' }] : []),
      { key: 'amplitude', symbol: 'x_0', min: -0.75, max: 0.75, step: 0.05, unit: 'm' },
    ],
  });
}
