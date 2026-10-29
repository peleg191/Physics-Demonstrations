import { row, fraction, identifier as i, expression as e, power, subscript, trig } from './math.js';
export function oscillatorAnalysis(kind, words, paused, ended) {
  const pendulum = kind === 'pendulum', q = i(pendulum ? 'θ' : 'x'), omega = i('ω');
  const amplitude = pendulum ? subscript(i('θ'), ['mn', '0']) : i('A');
  const ratio = pendulum ? fraction(i('g'), i('L')) : fraction(i('k'), i('m'));
  const inverseRatio = pendulum ? fraction(i('L'), i('g')) : fraction(i('m'), i('k'));
  const acceleration = fraction(row(power(i('d'), 2), q), row(i('d'), power(i('t'), 2)));
  const math = (text, expression) => ({ math: true, text, expression, label: text });
  const prose = text => ({ text });
  return {
    title: words.title, close: words.close, notice: paused ? words.paused : '', axis: words.axis, cutoff: ended ? words.end : '',
    equations: [pendulum
      ? math('mL d²θ/dt² = −mg sin θ ≈ −mgθ', row(i('m'), i('L'), acceleration, e('= −mg'), trig('sin', i('θ')), e('≈ −mg'), i('θ')))
      : math('N − mg = 0; F = −kx = m d²x/dt²', row(e('N − mg = 0'), e('; F = −kx = m'), acceleration))],
    solutionTitle: words.derive,
    solution: [prose(words.approximation),
      math(pendulum ? 'd²θ/dt² + (g/L)θ = 0' : 'd²x/dt² + (k/m)x = 0', row(acceleration, e('+'), ratio, q, e('= 0'))),
      math(pendulum ? 'ω = √(g/L)' : 'ω = √(k/m)', row(omega, e('='), ['msqrt', ratio])),
      prose(words.solution),
      math(pendulum ? 'θ(t) = θ₀ cos(ωt)' : 'x(t) = A cos(ωt)', row(q, e('(t) ='), amplitude, trig('cos', row(e('('), omega, i('t'), e(')'))))),
      math(pendulum ? 'dθ/dt = −θ₀ω sin(ωt)' : 'v(t) = −Aω sin(ωt)', row(pendulum ? fraction(row(i('d'), q), row(i('d'), i('t'))) : e('v(t)'), e('= −'), amplitude, omega, trig('sin', row(e('('), omega, i('t'), e(')'))))),
      math(pendulum ? 'T = 2π/ω = 2π√(L/g)' : 'T = 2π/ω = 2π√(m/k)', row(e('T ='), fraction(e('2π'), omega), e('= 2π'), ['msqrt', inverseRatio])),
      prose(words.conclusion)],
  };
}
