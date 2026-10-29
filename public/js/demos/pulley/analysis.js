import { pulleyForces } from './physics.js';
import { format } from '../../core/i18n.js';
import { row, fraction, expression } from '../../core/math.js';

export function bodyAnalysis(params, gravity, body, words, { paused = false, cutoff = false } = {}) {
  const { tension, acceleration } = pulleyForces(params, gravity);
  const left = body === 'mass1', symbol = left ? 'm₁' : 'm₂', mass = params[body];
  const weight = mass * gravity;
  const maximum = Math.max(params.mass1 * gravity, params.mass2 * gravity, tension);
  const f = value => format(value, 2);
  const math = (text, label, tree) => ({ math: true, text, label, expression: tree }); const prose = text => ({ text });
  return {
    title: `${words.analyze}: ${words[body]} (${symbol})`, close: words.closeAnalysis, symbol,
    notice: paused ? words.analysisPaused : '', cutoff: cutoff && acceleration !== 0 ? words.analysisCutoff : '',
    positiveDirection: left ? 1 : -1,
    forces: [{ magnitude: tension, direction: -1, symbol: 'T', label: `${words.tension} T = ${f(tension)} N` }, { magnitude: weight, direction: 1, symbol: `${symbol}g`, label: `${words.weight} ${symbol}g = ${f(weight)} N` }],
    pixelsPerNewton: 90 / maximum,
    description: words.forceDescription(words[body], f(tension), f(weight)),
    axis: left ? words.leftAxis : words.rightAxis,
    numericTitle: words.substitute, solutionTitle: words.solve,
    equations: [math('ΣFᵧ = ma', words.newtonSpoken), math(left ? 'm₁g − T = m₁a' : 'T − m₂g = m₂a', left ? words.leftEquationSpoken : words.rightEquationSpoken), prose(left ? words.leftSigns : words.rightSigns)],
    numeric: [math(left
      ? `(${f(mass)} kg)(${f(gravity)} m/s²) − ${f(tension)} N ≈ (${f(mass)} kg)(${f(acceleration)} m/s²)`
      : `${f(tension)} N − (${f(mass)} kg)(${f(gravity)} m/s²) ≈ (${f(mass)} kg)(${f(acceleration)} m/s²)`),
    math(`ΣFᵧ ≈ ${f(mass * acceleration)} N`)],
    solution: [math('m₁g − T = m₁a', words.leftEquationSpoken), math('T − m₂g = m₂a', words.rightEquationSpoken), prose(words.sameTension), prose(words.sameAcceleration),
      prose(words.addEquations), math('(m₁ − m₂)g = (m₁ + m₂)a'), math('a = (m₁ − m₂)g / (m₁ + m₂)', words.accelerationSpoken, row(expression('a ='), fraction(expression('(m₁ − m₂)g'), expression('m₁ + m₂')))),
      prose(words.findTension), math('T = m₁(g − a) = 2m₁m₂g / (m₁ + m₂)', words.tensionSpoken, row(expression('T = m₁(g − a) ='), fraction(expression('2m₁m₂g'), expression('m₁ + m₂')))),
      prose(acceleration === 0 ? words.equilibriumAnalysis : acceleration > 0 ? words.positiveAnalysis : words.negativeAnalysis)],
  };
}
