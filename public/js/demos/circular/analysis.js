import { row, expression as e, fraction as f, identifier as i, power as pow, trig, subscript } from '../../core/math.js';
import { latexStep } from '../../core/latex.js';
const math = (text, expression = e(text)) => ({ math: true, text, expression, label: text });
const prose = text => ({ text });
const cos = theta => trig('cos', i(theta)), sin = theta => trig('sin', i(theta));
export function circularAnalysis(kind, words, state, paused, ended) {
  const data = { title: words.title, close: words.close, notice: paused ? words.paused : '', axis: words.axis,
    cutoff: kind === 'rotating-tube' && !state.valid && ended ? words.slidingEnd : !state.valid ? words.invalid : ended ? kind === 'energy-bowl' ? words.bowlEnd : words.circularEnd : '',
    solutionTitle: words.derive, equations: [], solution: [prose(words.explanation)] };
  if (kind === 'rotating-tube') {
    data.equations = [math('N − mg = 0'), math('fₛ = mω²r ≤ μₛmg')];
    if (!state.valid) data.equations = [math('N − mg = 0'), math('fₖ = μₖmg; μₖ = μₛ'), math('r̈ = ω²r − μₖg'), math('N_wall = 2mωṙ')];
    data.solution.push(math('ω = 2πf'), math('ω²r ≤ μₛg'),
      math('f_max = (1/2π)√(μₛg/r)', row(subscript(i('f'), ['mtext', 'max']), e('='), f(e('1'), e('2π')), ['msqrt', f(e('μₛg'), i('r'))])),
      math('r_max = μₛg/(2πf)²', row(subscript(i('r'), ['mtext', 'max']), e('='), f(e('μₛg'), pow(e('(2πf)'), 2)))));
  } else if (kind === 'two-string') {
    data.equations = [math('(T₁ − T₂) sin α = mg', row(e('(T₁ − T₂)'), sin('α'), e('= mg'))),
      math('(T₁ + T₂) cos α = mω²r', row(e('(T₁ + T₂)'), cos('α'), e('= mω²r')))];
    data.solution.push(
      math('r = √(ℓ² − d²/4)', row(e('r ='), ['msqrt', row(pow(i('ℓ'), 2), e('−'), f(pow(i('d'), 2), e('4')))])),
      math('sin α = d/(2ℓ)', row(sin('α'), e('='), f(i('d'), e('2ℓ')))),
      math('ω = 2πf; v = ωr'),
      math('T₁ + T₂ = mω²ℓ'),
      math('T₁ − T₂ = 2mgℓ/d', row(e('T₁ − T₂ ='), f(e('2mgℓ'), i('d')))),
      math('T₁ = mω²ℓ/2 + mgℓ/d', row(e('T₁ ='), f(e('mω²ℓ'), e('2')), e('+'), f(e('mgℓ'), i('d')))),
      math('T₂ = mω²ℓ/2 − mgℓ/d ≥ 0', row(e('T₂ ='), f(e('mω²ℓ'), e('2')), e('−'), f(e('mgℓ'), i('d')), e('≥ 0'))),
      math('f_min = √(2g/d)/(2π)', row(subscript(i('f'), ['mtext', 'min']), e('='), f(['msqrt', f(e('2g'), i('d'))], e('2π')))));
  } else {
    data.equations = [math('N − mg cos θ = mv²/R', row(e('N − mg'), cos('θ'), e('='), f(e('mv²'), i('R')))),
      math('maₜ = −mg sin θ', row(e('maₜ = −mg'), sin('θ')))];
    const L = source => latexStep(source);
    data.solution.push(
      prose(words.zeroReference),
      L(String.raw`h_A=0,\quad h(\theta)=-R\cos\theta`),
      L(String.raw`E_g^{(A)}=mgh=-mgR\cos\theta`),
      L(String.raw`E_k+E_g^{(A)}=E_{\mathrm{tot}}^{(A)}=-mgR\cos\theta_0`),
      L(String.raw`E_k=\frac{1}{2}mv^2=mgR(\cos\theta-\cos\theta_0)`),
      L(String.raw`v^2=2gR(\cos\theta-\cos\theta_0)`),
      L(String.raw`a_r=\frac{v^2}{R},\quad a_t=-g\sin\theta`),
      L(String.raw`N=m\left(g\cos\theta+\frac{v^2}{R}\right)`),
      { heading: true, text: words.questionHeading },
      prose(words.questionIntro),
      L(String.raw`R=1\,\mathrm{m},\quad g=10\,\mathrm{m}/\mathrm{s}^2,\quad\theta_0=90^\circ`),
      L(String.raw`E_k(A)=0,\quad E_g^{(A)}(A)=0,\quad E_{\mathrm{tot}}^{(A)}=0`),
      L(String.raw`0=\frac{1}{2}mv^2-mgR\cos\theta`),
      L(String.raw`v^2=2gR\cos\theta,\quad a_r=2g\cos\theta`),
      L(String.raw`|a_t|=g|\sin\theta|`),
      L(String.raw`\theta_A=90^\circ:\quad a_r(A)=2(10)\cos90^\circ=0`),
      L(String.raw`|a_t(A)|=10\sin90^\circ=10\,\mathrm{m}/\mathrm{s}^2`),
      L(String.raw`\theta_B=30^\circ:\quad a_r(B)=2(10)\cos30^\circ=10\sqrt{3}`),
      L(String.raw`a_r(B)\approx17.32\,\mathrm{m}/\mathrm{s}^2`),
      L(String.raw`|a_t(B)|=10\sin30^\circ=5\,\mathrm{m}/\mathrm{s}^2`),
      L(String.raw`\theta_C=0^\circ:\quad a_r(C)=2(10)\cos0^\circ=20\,\mathrm{m}/\mathrm{s}^2`),
      L(String.raw`|a_t(C)|=10\sin0^\circ=0`),
      prose(words.barReference),
      L(String.raw`E_g^{(C)}=E_g^{(A)}+mgR,\quad E_{\mathrm{tot}}^{(C)}=E_{\mathrm{tot}}^{(A)}+mgR`));
  }
  data.solution.push(prose(words.conclusion)); return data;
}
