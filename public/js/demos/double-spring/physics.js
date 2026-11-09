import { oscillatorState as singleState } from '../spring/physics.js';
export const defaultParameters = Object.freeze({ mass: 2, stiffness: 20, amplitude: 0.6 });
export const oscillatorState = (params, time) => singleState({ ...params, stiffness: 2 * params.stiffness }, time);
export const duration = params => 4 * oscillatorState(params, 0).period;
