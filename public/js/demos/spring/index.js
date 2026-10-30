import { mountOscillator } from '../../core/oscillator.js';
import { defaultParameters, oscillatorState, duration } from './physics.js';
import { strings } from './strings.js';
export const mount = options => mountOscillator({ ...options, kind: 'spring', strings, defaultParameters, oscillatorState, duration,
  specs: [
    { key: 'mass', symbol: 'm', min: 1, max: 30, step: 0.5, unit: 'kg' },
    { key: 'stiffness', symbol: 'k', min: 1, max: 100, step: 1, unit: 'N/m' },
    { key: 'amplitude', symbol: 'x_0', min: 0.05, max: 1, step: 0.05, unit: 'm' },
  ],
});
