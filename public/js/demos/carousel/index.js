import { createExperiment } from '../../core/experiment.js';
import { createBodyAnalysis } from '../../core/body-analysis.js';
import { parameter, metric } from '../../core/controls.js';
import { element, svgElement as s, svgText } from '../../core/dom.js';
import { expression, row, fraction, trig, identifier as i, power } from '../../core/math.js';
import { motionModel } from '../../core/motion-graphs.js';
import { geometryLayer, angleGuide, dimensionGuide, showInitialGeometry } from '../../core/geometry.js';
import { prepareSketchOutlines } from '../../core/sketch.js';
import * as config from '../../config.js';
import { defaultParameters, carouselState, duration } from './physics.js';
import { strings } from './strings.js';

export function mount({ root, lang }) {
  const gravity = config.physicsConfig.gravity;
  // A page opened before this setting was added may still hold the older config module.
  const showTrail = config.carouselConfig?.showTrail ?? true;
  let params = { ...defaultParameters }, words = strings[lang], selected = false, paused = false, ready = false;
  const controls = new Map();
  const api = createExperiment({ root, lang, showQuizForces: () => { selected = true; }, system: 'carousel', duration: () => duration(params, gravity), render, reset, defaults,
    motion: () => motionModel(time => { const state = carouselState(params, time, gravity); return [state.position, state.velocity, state.accelerations]; }, { components: ['graphCarouselX', 'graphCarouselY'], note: 'graphCarouselNote' }) });
  api.svg.setAttribute('role', 'group');
  const hint = element('p', 'analysis-hint'); hint.id = 'carousel-hint'; api.stageColumn.append(hint);
  const analysis = createBodyAnalysis({ parent: api.stageColumn, signal: api.signal, id: 'carousel-analysis', onClose: close });
  const specs = [
    { key: 'mass', symbol: 'm', min: 0.5, max: 20, step: 0.5, unit: 'kg' },
    { key: 'radius', symbol: 'R', min: 0.2, max: 3, step: 0.1, unit: 'm' },
    { key: 'angle', symbol: 'α', min: 10, max: 75, step: 1, unit: '°' },
  ];
  for (const spec of specs) {
    const control = parameter({ ...spec, id: `carousel-${spec.key}`, label: words[spec.key], value: params[spec.key], signal: api.signal,
      onChange(value) { params[spec.key] = value; reset(); } });
    controls.set(spec.key, control); api.parameters.append(control.root);
  }
  const readings = [['speed', 'm/s', 'v'], ['tension', 'N', 'T'], ['period', 's', 'P']].map(([key, unit, symbol]) => ({ key, unit, ...metric(words[key], unit, symbol) }));
  for (const reading of readings) api.metrics.append(reading.root);
  const sideLabel = svgText(api.svg, 215, 45, '', { 'text-anchor': 'middle' });
  const topLabel = svgText(api.svg, 590, 45, '', { 'text-anchor': 'middle' });
  s('path', { d: 'M 135 90 H 295 M 215 90 V 405', stroke: 'var(--scene-structure, #839775)', 'stroke-width': 3, 'stroke-dasharray': '5 5', fill: 'none' }, api.svg);
  const orbit = s('line', { x1: 90, y1: 350, x2: 340, y2: 350, fill: 'none', stroke: 'var(--scene-structure, #839775)', 'stroke-dasharray': '5 5' }, api.svg);
  const trailLayer = s('g', { class: 'carousel-side-trail', fill: 'none', stroke: 'var(--scene-warm, #c38e60)', 'stroke-linecap': 'round', 'pointer-events': 'none', 'aria-hidden': 'true' }, api.svg);
  const trailSegments = Array.from({ length: 32 }, () => s('path', { class: 'carousel-trail-segment' }, trailLayer));
  const trailPencilLayer = s('g', { class: 'carousel-trail-pencil' }, trailLayer);
  const trailEdges = trailSegments.map(() => s('path', {}, trailPencilLayer));
  const string = s('path', { stroke: 'var(--scene-warm-edge, #ad8959)', 'stroke-width': 3, fill: 'none' }, api.svg);
  s('circle', { cx: 590, cy: 250, r: 125, fill: 'none', stroke: 'var(--scene-structure, #839775)', 'stroke-dasharray': '5 5' }, api.svg);
  s('circle', { cx: 590, cy: 250, r: 4, fill: 'var(--scene-green, #61816b)' }, api.svg);
  const radius = s('path', { stroke: 'var(--scene-warm-edge, #ad8959)', 'stroke-width': 2, fill: 'none' }, api.svg);
  const balls = [0, 1].map(() => {
    const ball = s('g', { class: 'selectable-mass', role: 'button', tabindex: 0, 'aria-controls': 'carousel-analysis', 'aria-describedby': hint.id }, api.svg);
    s('circle', { class: 'mass-hit', r: 32, fill: 'transparent' }, ball);
    const artwork = s('g', { class: 'carousel-ball-art' }, ball);
    s('circle', { class: 'mass-body', r: 17, fill: 'var(--scene-warm, #c38e60)' }, artwork);
    svgText(artwork, 0, 5, 'm', { class: 'carousel-mass-label', 'text-anchor': 'middle' });
    ball.addEventListener('click', select, { signal: api.signal });
    ball.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); } }, { signal: api.signal });
    return ball;
  });
  const sideArtwork = balls[0].children[1];
  const forceLayer = s('g', { 'pointer-events': 'none' }, api.svg);
  const arrows = ['var(--scene-force-blue, #174d77)', 'var(--scene-force-weight, #9a451b)', 'var(--scene-force-blue, #174d77)', 'var(--scene-green, #61816b)'].map(color => s('path', { stroke: color, 'stroke-width': 3, fill: 'none' }, forceLayer));
  const labels = ['T', 'mg', 'T sin α', 'v'].map(label => svgText(forceLayer, 0, 0, label, { 'text-anchor': 'middle' }));
  const initialGeometry = geometryLayer(api.svg);
  let geometrySignature = '';
  function arrow(index, x, y, dx, dy) {
    const length = Math.hypot(dx, dy), ux = dx / length, uy = dy / length;
    arrows[index].setAttribute('d', `M ${x} ${y} l ${dx} ${dy} m ${-9 * ux + 5 * uy} ${-9 * uy - 5 * ux} l ${9 * ux - 5 * uy} ${9 * uy + 5 * ux} l ${-9 * ux - 5 * uy} ${-9 * uy + 5 * ux}`);
    labels[index].setAttribute('x', x + dx + 15); labels[index].setAttribute('y', y + dy - 10);
  }
  function reset() { paused = false; api.clock.reset(); }
  function defaults() { params = { ...defaultParameters }; for (const [key, control] of controls) control.update(params[key]); reset(); }
  function close() { selected = false; paused = false; analysis.hide(); render(api.clock.time); balls[0].focus({ preventScroll: true }); }
  function select() { paused = api.clock.playing; if (paused) api.clock.pause(); selected = true; render(api.clock.time); }
  root.addEventListener('keydown', event => { if (event.key === 'Escape' && selected && !event.defaultPrevented) { event.preventDefault(); close(); } }, { signal: api.signal });
  function render(time, { updateReadouts = true } = {}) {
    if (!ready) return;
    const state = carouselState(params, time, gravity), c = Math.cos(state.phase), sn = Math.sin(state.phase);
    // Both views are schematic; the side-view height preserves the selected string angle.
    const scale = Math.min(125 / params.radius, 250 / state.height);
    const r = params.radius * scale, h = state.height * scale, x = 215 + r * c, y = 90 + h;
    // Reserve both complete orbits, including the string and initial dimensions.
    api.setGraphObstacles([
      { left: 80, top: 75, width: 280, height: Math.min(390, h + 95) },
      { left: 445, top: 105, width: 290, height: 290 },
      { left: 145, top: 30, width: 140, height: 28 },
      { left: 520, top: 30, width: 140, height: 28 },
    ]);
    orbit.setAttribute('y1', y); orbit.setAttribute('y2', y); orbit.setAttribute('x1', 215 - r); orbit.setAttribute('x2', 215 + r);
    string.setAttribute('d', `M 215 90 L ${x} ${y}`);
    radius.setAttribute('d', `M 590 250 L ${590 + 125 * c} ${250 + 125 * sn}`);
    balls[0].setAttribute('transform', `translate(${x} ${y})`);
    // Depth cues affect the artwork only; the physical projection stays at constant height.
    sideArtwork.setAttribute('transform', `scale(${1 + 0.12 * sn})`);
    sideArtwork.setAttribute('opacity', String(1 - 0.4 * Math.max(0, -sn)));
    trailLayer.setAttribute('display', showTrail && time > 0 ? 'inline' : 'none');
    const trailDuration = state.period * 0.14;
    const ballRadius = 17 * (1 + 0.12 * sn);
    if (showTrail) trailSegments.forEach((segment, index) => {
      const recency = (index + 1) / trailSegments.length;
      const olderAge = (1 - index / trailSegments.length) * trailDuration;
      const newerAge = (1 - recency) * trailDuration;
      const olderPhase = state.phase - state.omega * Math.min(time, olderAge);
      const newerPhase = state.phase - state.omega * Math.min(time, newerAge);
      const x1 = 215 + r * Math.cos(olderPhase), x2 = 215 + r * Math.cos(newerPhase);
      const depth = Math.sin((olderPhase + newerPhase) / 2);
      // Fade at the ball's edge and at reversals, where a side projection bunches up.
      const clearance = Math.min(Math.abs(x1 - x), Math.abs(x2 - x)) - ballRadius;
      const edgeFade = Math.max(0, Math.min(1, clearance / 10));
      const turnFade = Math.abs(depth);
      segment.setAttribute('d', `M ${x1} ${y} L ${x2} ${y}`);
      const width = (1.5 + 8 * recency ** 1.5) * (1 + 0.12 * depth);
      const opacity = time > newerAge
        ? 0.55 * recency ** 1.6 * edgeFade * turnFade * (1 - 0.4 * Math.max(0, -depth)) : 0;
      segment.setAttribute('stroke-width', width);
      segment.setAttribute('opacity', opacity);
      trailEdges[index].setAttribute('d', `M ${x1} ${y - width / 2} L ${x2} ${y - width / 2} M ${x1} ${y + width / 2} L ${x2} ${y + width / 2}`);
      trailEdges[index].setAttribute('opacity', opacity);
    });
    balls[1].setAttribute('transform', `translate(${590 + 125 * c} ${250 + 125 * sn})`);
    for (const ball of balls) { ball.setAttribute('aria-label', words.block); ball.setAttribute('aria-pressed', String(selected)); }
    forceLayer.setAttribute('display', selected ? 'inline' : 'none');
    const alpha = params.angle * Math.PI / 180;
    showInitialGeometry(initialGeometry, time, api.clock.playing);
    if (time === 0 && !api.clock.playing) {
      const signature = `${params.radius}:${params.angle}`;
      if (signature !== geometrySignature) {
        geometrySignature = signature;
        initialGeometry.replaceChildren();
        angleGuide(initialGeometry, 215, 90, Math.min(48, h * 0.7), Math.PI / 2 - alpha, Math.PI / 2,
          `α = ${params.angle}°`, 153, 125);
        s('path', { class: 'geometry-reference', d: `M 215 ${y + 8} V ${y + 45} M ${215 + r} ${y + 22} V ${y + 45}` }, initialGeometry);
        dimensionGuide(initialGeometry, 215, y + 38, 215 + r, y + 38,
          `R = ${params.radius.toFixed(1)} m`, 215 + r / 2, y + 65);
        const stringPixels = Math.hypot(r, h);
        const offsetX = 22 * h / stringPixels, offsetY = -22 * r / stringPixels;
        dimensionGuide(initialGeometry, 215 + offsetX, 90 + offsetY,
          215 + r + offsetX, y + offsetY, `L = ${state.length.toFixed(2)} m`,
          215 + r / 2 + offsetX + 42, 90 + h / 2 + offsetY);
      }
    }
    arrow(0, x, y, -85 * Math.sin(alpha) * c, -85 * Math.cos(alpha));
    arrow(1, x, y, 0, 85 * Math.cos(alpha));
    arrow(2, 590 + 125 * c, 250 + 125 * sn, -70 * c, -70 * sn);
    arrow(3, 590 + 125 * c, 250 + 125 * sn, -60 * sn, 60 * c);
    if (api.clock.playing) paused = false;
    if (!updateReadouts) return;
    for (const reading of readings) reading.set(state[reading.key]);
    const ended = time >= duration(params, gravity);
    api.feedback.textContent = ended ? words.end : words.moving;
    api.setDescription(`${words.caption}. ${words.speed}: ${state.speed.toFixed(2)} m/s. ${words.moving}`);
    if (selected) {
      const math = (text, formula = expression(text)) => ({ math: true, text, label: text, expression: formula });
      analysis.update({ title: words.title, close: words.close, notice: paused ? words.paused : '', axis: words.axis, cutoff: ended ? words.end : '',
        equations: [math('T cos α − mg = 0', row(i('T'), trig('cos', i('α')), expression('−mg = 0'))), math('T sin α = mv²/R', row(i('T'), trig('sin', i('α')), expression('='), fraction(row(i('m'), power(i('v'), 2)), i('R'))))], solutionTitle: words.derive,
        solution: [math('T = mg / cos α', row(expression('T ='), fraction(expression('mg'), trig('cos', i('α'))))), math('v²/R = g tan α', row(fraction(power(i('v'), 2), i('R')), expression('= g'), trig('tan', i('α')))), math('v = √(Rg tan α)', row(expression('v ='), ['msqrt', row(expression('Rg'), trig('tan', i('α')))])), math('ω = v/R; P = 2πR/v', row(expression('ω ='), fraction(i('v'), i('R')), expression('; P ='), fraction(expression('2πR'), i('v')))), { text: words.periodDefinition }, { text: words.conclusion }] });
    }
  }
  function setLanguage(next) {
    words = strings[next]; api.setLanguage(next);
    for (const spec of specs) controls.get(spec.key).localize(words[spec.key], spec.unit);
    for (const reading of readings) reading.localize(words[reading.key], reading.unit);
    hint.textContent = words.hint; api.modelText.textContent = words.about; api.liveMark.textContent = words.caption;
    sideLabel.textContent = words.side; topLabel.textContent = words.top; render(api.clock.time);
  }
  prepareSketchOutlines(api.svg); ready = true; setLanguage(lang); api.clock.reset();
  return { reset, setLanguage, dispose: () => api.dispose() };
}
