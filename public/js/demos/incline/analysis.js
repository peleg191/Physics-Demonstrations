import { expression, row, identifier as i, subscript, trig } from '../../core/math.js';
const math = text => ({ math: true, text, expression: expression(text), label: text });
const prose = text => ({ text });
const mu = index => subscript(i('μ'), i(index));
const alpha = i('α');
const frictionTerm = index => row(mu(index), i('m'), i('g'), trig('cos', alpha));
export function bodyAnalysis(words, state, paused, ended) {
  return {
    title: words.title, close: words.close, notice: paused ? words.paused : '', axis: words.axis,
    cutoff: ended && !state.resting ? words.cutoff : '',
    equations: [
      { ...math('N − mg cos α = 0'), expression: row(i('N'), ['mo', '−'], i('m'), i('g'), trig('cos', alpha), ['mo', '='], ['mn', '0']) },
      { ...math('N = mg cos α'), expression: row(i('N'), ['mo', '='], i('m'), i('g'), trig('cos', alpha)) },
      state.resting
        ? { ...math('f = mg sin α, a = 0'), expression: row(i('f'), ['mo', '='], i('m'), i('g'), trig('sin', alpha), ['mo', ','], i('a'), ['mo', '='], ['mn', '0']) }
        : { ...math('f = μₖmg cos α'), expression: row(i('f'), ['mo', '='], frictionTerm('k')) },
      prose(state.resting ? words.staticNote : words.kineticNote)],
    solutionTitle: words.derive,
    solution: [prose(words.threshold),
      { ...math('mg sin α ≤ μₛmg cos α'), expression: row(i('m'), i('g'), trig('sin', alpha), ['mo', '≤'], frictionTerm('s')) },
      prose(words.cancel),
      { ...math('tan α ≤ μₛ'), expression: row(trig('tan', alpha), ['mo', '≤'], mu('s')) },
      { ...math('αₘₐₓ = arctan(μₛ)'), expression: row(subscript(alpha, ['mtext', 'max']), ['mo', '='], ['mi', { mathvariant: 'normal' }, 'arctan'], ['mo', '('], mu('s'), ['mo', ')']) },
      prose(words.motion),
      { ...math('ma = mg sin α − μₖmg cos α'), expression: row(i('m'), i('a'), ['mo', '='], i('m'), i('g'), trig('sin', alpha), ['mo', '−'], frictionTerm('k')) },
      { ...math('a = g(sin α − μₖ cos α)'), expression: row(i('a'), ['mo', '='], i('g'), ['mo', '('], trig('sin', alpha), ['mo', '−'], mu('k'), trig('cos', alpha), ['mo', ')']) },
      prose(words.independent)],
  };
}
