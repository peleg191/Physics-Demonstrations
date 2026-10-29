import { mountOscillator } from '../../core/oscillator.js';
import { defaultParameters, oscillatorState, duration } from './physics.js';
import { strings } from './strings.js';
export const mount = options => mountOscillator({ ...options, kind: 'pendulum', strings, defaultParameters, oscillatorState, duration,
  specs: [
    { key: 'mass', min: 1, max: 30, step: 0.5, unit: 'kg' },
    { key: 'length', min: 0.5, max: 3, step: 0.1, unit: 'm' },
    { key: 'amplitude', min: 1, max: 15, step: 0.5, unit: '°' },
  ],
});
