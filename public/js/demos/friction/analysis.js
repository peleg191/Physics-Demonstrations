import { latexStep } from '../../core/latex.js';
import { bodyForces } from './forces.js';
import { solve } from './physics.js';
import { format } from '../../core/i18n.js';

// LaTeX is the source of truth for every displayed derivation.
export function solutionSteps(kind, words) {
  const math = latexStep, prose = text => ({ text });
  if (kind === 'stacked') return [prose(words.movingBranch), prose(words.vertical), math(String.raw`N_t=mg,\qquad N_f=mg+N_t=2mg`),
    prose(words.eachBody), math(String.raw`f_s=ma,\qquad F-\mu N_f-f_s=ma`),
    prose(words.add), math(String.raw`2ma=F-2\mu mg`), math(String.raw`a=\frac{F-2\mu mg}{2m}`),
    prose(words.limit), math(String.raw`\lvert f_s\rvert\leq 3\mu N_t,\qquad a_{\mathrm{max}}=3\mu g`),
    math(String.raw`F_{\mathrm{crit}}=2\mu mg+2m(3\mu g)=8\mu mg`), prose(words.thresholdNote), prose(words.slidingModel),
    math(String.raw`f_{k,t}=\mu_{k,t}mg`), math(String.raw`a_t=\mu_{k,t}g`),
    math(String.raw`a_b=\frac{F-2\mu mg-\mu_{k,t}mg}{m}`),
    math(String.raw`x_b-x_t=\frac{1}{2}(a_b-a_t)t^2`)];
  if (kind === 'table') return [prose(words.movingBranch), prose(words.vertical), math(String.raw`N_1=m_1g,\qquad f_k=\mu_km_1g`),
    prose(words.eachBody), math(String.raw`T-\mu_km_1g=m_1a`), math(String.raw`m_2g\sin\alpha-T=m_2a`),
    prose(words.add), math(String.raw`(m_1+m_2)a=m_2g\sin\alpha-\mu_km_1g`),
    math(String.raw`a=\frac{g(m_2\sin\alpha-\mu_km_1)}{m_1+m_2}`),
    prose(words.substituteTension), math(String.raw`T=m_1a+\mu_km_1g=\frac{m_1m_2g(\sin\alpha+\mu_k)}{m_1+m_2}`), prose(words.signedNote)];
  return [{ text: words.staticCase, heading: true }, prose(words.staticIntro), prose(words.hangingAxis),
    math(String.raw`a=0,\qquad T=m_1g,\qquad N_2=m_2g\cos\alpha`),
    prose(words.staticSigns), math(String.raw`m_2g\sin\alpha-T+f_s=0`),
    math(String.raw`f_s=m_1g-m_2g\sin\alpha`),
    math(String.raw`\lvert f_s\rvert\leq\mu_sN_2`),
    math(String.raw`\lvert m_2g\sin\alpha-m_1g\rvert\leq\mu_sm_2g\cos\alpha`),
    math(String.raw`\lvert m_2\sin\alpha-m_1\rvert\leq\mu_sm_2\cos\alpha`),
    math(String.raw`m_2(\sin\alpha-\mu_s\cos\alpha)\leq m_1\leq m_2(\sin\alpha+\mu_s\cos\alpha)`),
    prose(words.staticAdjustment), prose(words.staticAssumption), math(String.raw`\mu_s=\mu_k`),
    prose(words.movingBranch), { text: words.downCase, heading: true },
    math(String.raw`N_2=m_2g\cos\alpha,\qquad T-m_1g=m_1a`),
    prose(words.downBranch), math(String.raw`m_2g\sin\alpha-T-\mu_km_2g\cos\alpha=m_2a`),
    math(String.raw`a=\frac{g[m_2(\sin\alpha-\mu_k\cos\alpha)-m_1]}{m_1+m_2}`),
    { text: words.upCase, heading: true }, prose(words.upBranch), math(String.raw`m_2g\sin\alpha-T+\mu_km_2g\cos\alpha=m_2a`),
    math(String.raw`a=\frac{g[m_2(\sin\alpha+\mu_k\cos\alpha)-m_1]}{m_1+m_2}`),
    prose(words.substituteTension), math(String.raw`T=m_1(g+a)`), prose(words.signedNote)];
}
// Current-value substitution is separate from the symbolic derivation. Always
// use the model's actual regime and motion direction, including static release.
export function accelerationCalculation(kind, params, g, words) {
  const state = solve(kind, params, g), math = latexStep, prose = text => ({ text });
  const n = value => String(Number(value.toFixed(6)));
  const unit = String.raw`\,\mathrm{m}/\mathrm{s}^{2}`;
  const result = value => `${format(value)}${unit}`;
  const inputs = [prose(words.substitutionNote)];
  if (kind === 'stacked') {
    const m = n(params.mass), mu = n(params.mu), force = n(params.force), gravity = n(g);
    inputs.push(prose(words.stackedAxis), math(`m=${m}\\,\\mathrm{kg},\\quad F=${force}\\,\\mathrm{N},\\quad\\mu=${mu}`),
      math(`g=${gravity}${unit}`),
      math(`F_{\\mathrm{crit}}=8(${mu})(${m})(${gravity})\\approx ${format(state.threshold)}\\,\\mathrm{N}`));
    if (state.resting) return [...inputs,
      math(`F=${force}\\,\\mathrm{N}\\leq\\mu N_f=2(${mu})(${m})(${gravity})\\approx ${format(params.mu * state.groundNormal)}\\,\\mathrm{N}`),
      prose(words.resting), math(`a_t=a_b=0${unit}`)];
    if (state.slipping) return [...inputs, prose(words.slipping),
      math(`\\mu_{k,t}=${n(state.muBetween)}`),
      math(`a_t=\\mu_{k,t}g=(${n(state.muBetween)})(${gravity})\\approx ${result(state.topAcceleration)}`),
      math(`a_b=\\frac{${force}-2(${mu})(${m})(${gravity})-(${n(state.muBetween)})(${m})(${gravity})}{${m}}\\approx ${result(state.bottomAcceleration)}`)];
    return [...inputs, prose(words.stickingTag),
      math(`a_t=a_b=\\frac{${force}-2(${mu})(${m})(${gravity})}{2(${m})}\\approx ${result(state.acceleration)}`)];
  }
  const m1 = n(params.mass1), m2 = n(params.mass2), mu = n(params.mu), gravity = n(g), angle = `${n(params.angle)}^{\\circ}`;
  inputs.push(prose(kind === 'hanging' ? words.hangingAxis : words.tableAxis),
    math(`m_1=${m1}\\,\\mathrm{kg},\\quad m_2=${m2}\\,\\mathrm{kg}`),
    math(`\\alpha=${angle},\\quad\\mu_k=${mu},\\quad g=${gravity}${unit}`));
  if (state.resting) {
    const drive = Math.abs(params.mass2 * g * Math.sin(params.angle * Math.PI / 180) - (kind === 'hanging' ? params.mass1 * g : 0));
    inputs.push(math(kind === 'table'
      ? `m_2g\\sin\\alpha=(${m2})(${gravity})\\sin(${angle})\\approx ${format(drive)}\\,\\mathrm{N}`
      : `\\lvert m_2g\\sin\\alpha-m_1g\\rvert=\\lvert(${m2})(${gravity})\\sin(${angle})-(${m1})(${gravity})\\rvert\\approx ${format(drive)}\\,\\mathrm{N}`),
      math(kind === 'table'
        ? `f_{s,\\mathrm{max}}=(${mu})(${m1})(${gravity})\\approx ${format(params.mu * state.normal)}\\,\\mathrm{N}`
        : `f_{s,\\mathrm{max}}=(${mu})(${m2})(${gravity})\\cos(${angle})\\approx ${format(params.mu * state.normal)}\\,\\mathrm{N}`),
      math(`${format(drive)}\\,\\mathrm{N}\\leq ${format(params.mu * state.normal)}\\,\\mathrm{N}`),
      prose(words.resting), math(`a=0${unit}`));
    return inputs;
  }
  if (kind === 'hanging') inputs.push(prose(state.direction === 1 ? words.downBranch : words.upBranch));
  inputs.push(math(kind === 'table'
    ? `a=\\frac{(${gravity})[(${m2})\\sin(${angle})-(${mu})(${m1})]}{${m1}+${m2}}\\approx ${result(state.acceleration)}`
    : `a=\\frac{(${gravity})[(${m2})(\\sin(${angle})${state.direction === 1 ? '-' : '+'}(${mu})\\cos(${angle}))-${m1}]}{${m1}+${m2}}\\approx ${result(state.acceleration)}`),
    prose(words.signedNote));
  return inputs;
}

export function bodyAnalysis(kind, params, state, g, selected, words, { paused, ended }) {
  let equations, axis;
  if (kind === 'stacked') {
    axis = words.stackedAxis;
    equations = selected === 0
      ? [String.raw`N_t-mg=0`, String.raw`f_s=ma_t`, String.raw`\lvert f_s\rvert\leq 3\mu N_t`]
      : [String.raw`N_f-mg-N_t=0`, String.raw`F-f_k-f_s=ma_b`, String.raw`f_k=\mu N_f`];
    if (state.slipping) equations = selected === 0
      ? [String.raw`N_t-mg=0`, String.raw`f_{k,t}=\mu_{k,t}N_t=ma_t`]
      : [String.raw`N_f-mg-N_t=0`, String.raw`F-f_k-f_{k,t}=ma_b`, String.raw`f_k=\mu N_f`, String.raw`f_{k,t}=\mu_{k,t}N_t`];
  } else if (selected === 0) {
    axis = kind === 'table' ? words.tableAxis : words.hangingAxis;
    equations = kind === 'table' ? [String.raw`N_1-m_1g=0`, String.raw`T-f_k=m_1a`, String.raw`f_k=\mu_kN_1`]
      : [String.raw`T-m_1g=m_1a`];
  } else {
    axis = words.slopeAxis;
    equations = [String.raw`N_2-m_2g\cos\alpha=0`, kind === 'table' ? String.raw`m_2g\sin\alpha-T=m_2a`
      : `m_2g\\sin\\alpha-T${state.direction === 1 ? '-' : '+'}f_k=m_2a`];
    if (kind === 'hanging') equations.push(String.raw`f_k=\mu_kN_2`);
  }
  if (state.resting) {
    const normal = kind === 'stacked' ? 'N_f' : selected === 0 ? 'N_1' : 'N_2';
    equations = equations.map(text => text.replaceAll('f_k', 'f_s'));
    if (kind === 'stacked') equations = selected === 0
      ? [String.raw`N_t-mg=0`, String.raw`f_s=0,\quad a_t=0`]
      : [String.raw`N_f-mg-N_t=0`, String.raw`F-f_{s,f}=0`, String.raw`f_{s,f}\leq\mu N_f`];
    else equations = equations.filter(text => !text.startsWith('f_s=')).concat((kind === 'table' && selected === 0) || (kind === 'hanging' && selected === 1) ? [String.raw`f_s\leq\mu ` + normal] : []);
  }
  const forces = bodyForces(kind, params, state, g)[selected];
  return {
    title: `${words.analyze}: ${words[kind === 'stacked' ? selected === 0 ? 'topBody' : 'bottomBody' : selected === 0 ? 'body1' : 'body2']}`,
    close: words.close, notice: state.resting ? words.resting : state.slipping ? words.slipping : paused ? words.paused : '', axis,
    cutoff: ended ? state.slipping ? words.slipCutoff : words.cutoff : '',
    equations: equations.map(latexStep), numericTitle: words.currentForces,
    numeric: forces.map(force => latexStep(`${force.latex}=${format(Math.hypot(force.fx, force.fy))}\\,\\mathrm{N}`)),
    solutionTitle: words.solution, solution: [...solutionSteps(kind, words), { text: words.computeAcceleration, heading: true }, ...accelerationCalculation(kind, params, g, words)],
  };
}
