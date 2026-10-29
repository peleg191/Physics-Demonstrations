import { row, fraction, expression as e, identifier as i, subscript as sub, power, trig } from '../../core/math.js';

// Authored symbolic equations, with no second implementation of projectile dynamics.
export function motionAnalysis(words, { paused = false, ended = false } = {}) {
  const v0 = sub(i('v'), ['mn', '0']), theta = i('θ');
  const horizontal = row(v0, trig('cos', theta)), vertical = row(v0, trig('sin', theta));
  const halfGravity = row(fraction(['mn', '1'], ['mn', '2']), i('g'), power(i('t'), 2));
  const math = (text, tree, label) => ({ math: true, text, expression: tree, label });
  const prose = text => ({ text });
  const horizontalEquation = math('x(t) = v₀ cos θ · t', row(e('x(t) ='), horizontal, i('t')), words.positionXSpoken);
  const verticalEquation = math('y(t) = y₀ + v₀ sin θ · t − ½gt²', row(e('y(t) ='), sub(i('y'), ['mn', '0']), e('+'), vertical, i('t'), e('−'), halfGravity), words.positionYSpoken);
  const time = fraction(i('x'), horizontal);
  const parenthesizedTime = row(['mo', { fence: 'true', stretchy: 'true' }, '('], time, ['mo', { fence: 'true', stretchy: 'true' }, ')']);
  return {
    title: words.motionTitle, close: words.closeAnalysis, notice: paused ? words.analysisPaused : '',
    axis: words.axis, cutoff: ended ? words.analysisEnd : '',
    equations: [prose(words.symbols),
      math('v₀ₓ = v₀ cos θ', row(sub(i('v'), ['mn', '0'], i('x')), e('='), horizontal), words.launchXSpoken),
      math('v₀ᵧ = v₀ sin θ', row(sub(i('v'), ['mn', '0'], i('y')), e('='), vertical), words.launchYSpoken)],
    groups: [
      { title: words.horizontal, steps: [math('aₓ = 0', row(sub(i('a'), i('x')), e('= 0')), words.accelerationXSpoken), math('vₓ(t) = v₀ cos θ', row(sub(i('v'), i('x')), e('(t) ='), horizontal), words.velocityXSpoken), horizontalEquation] },
      { title: words.vertical, steps: [math('aᵧ = −g', e('aᵧ = −g'), words.accelerationYSpoken), math('vᵧ(t) = v₀ sin θ − gt', row(e('vᵧ(t) ='), vertical, e('− gt')), words.velocityYSpoken), verticalEquation, prose(words.apex)] },
    ],
    solutionTitle: words.deriveTrajectory,
    solution: [prose(words.eliminateTime), math('t = x / (v₀ cos θ)', row(e('t ='), time), words.timeSpoken),
      prose(words.substituteTime),
      math('y(x) = y₀ + v₀ sin θ · (x / (v₀ cos θ)) − ½g(x / (v₀ cos θ))²', row(e('y(x) ='), sub(i('y'), ['mn', '0']), e('+'), vertical, parenthesizedTime, e('−'), fraction(['mn', '1'], ['mn', '2']), i('g'), power(parenthesizedTime, 2)), words.substitutionSpoken),
      prose(words.simplifyTrajectory),
      math('y(x) = y₀ + x tan θ − gx² / (2v₀² cos² θ)', row(e('y(x) ='), sub(i('y'), ['mn', '0']), e('+ x'), trig('tan', theta), e('−'), fraction(row(i('g'), power(i('x'), 2)), row(['mn', '2'], power(v0, 2), trig('cos', theta, 2)))), words.trajectorySpoken),
      prose(words.quadraticForm),
      math('y(x) = Ax² + Bx + C', e('y(x) = Ax² + Bx + C'), words.quadraticSpoken),
      math('A = −g / (2v₀² cos² θ), B = tan θ, C = y₀', row(e('A = −'), fraction(i('g'), row(['mn', '2'], power(v0, 2), trig('cos', theta, 2))), e(','), e('B ='), trig('tan', theta), e(', C ='), sub(i('y'), ['mn', '0'])), words.coefficientsSpoken),
      prose(words.parabola)],
  };
}
