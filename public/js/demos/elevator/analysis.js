import { expression } from '../../core/math.js';
import { format } from '../../core/i18n.js';
const math = text => ({ math: true, text, label: text, expression: expression(text) });
export function bodyAnalysis(words, state, paused, ended) {
  const { mass: m, gravity: g, acceleration: a, normal, netForce } = state;
  const signedA = a < 0 ? `(${format(a, 2)})` : format(a, 2);
  return {
    title: words.title, close: words.close, notice: paused ? words.paused : '', axis: words.axis, cutoff: ended ? words.cutoff : '',
    equations: [math('ΣFᵧ = N − mg'), math('N − mg = ma')],
    numericTitle: words.numeric,
    numeric: [math(`ΣFᵧ = ${format(m)} × ${signedA} = ${format(netForce)} N`),
      math(`N = ${format(m)} × (${format(g)} + ${signedA}) = ${format(normal)} N`)],
    solutionTitle: words.derive,
    solution: [{ text: words.explain }, math('ΣFᵧ = N − mg = ma'), { text: words.rearrange },
      math('N = mg + ma'), math('N = m(g + a)'), { text: words.conclusion }],
  };
}
