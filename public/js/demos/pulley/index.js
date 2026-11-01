import { prepareSketchOutlines } from '../../core/sketch.js';
import { motionModel } from '../../core/motion-graphs.js';
import { physicsConfig } from '../../config.js';
import { createExperiment } from '../../core/experiment.js';
import { parameter, metric } from '../../core/controls.js';
import { element, setText, svgElement as s, svgText } from '../../core/dom.js';
import { translator, format } from '../../core/i18n.js';
import { defaultParameters, pulleyState, travelDuration } from './physics.js';
import { strings } from './strings.js';
import { createBodyAnalysis } from '../../core/body-analysis.js';
import { bodyAnalysis } from './analysis.js';
export function mount({ root, lang }) {
  let params = { ...defaultParameters }, words = strings[lang], scene;
  const gravity = physicsConfig.gravity; const controls = new Map();
  const api = createExperiment({ root, lang, system: 'pulley', motion: () => motionModel(time => { const state = pulleyState(params, time, gravity); return [[state.displacement], [state.velocity], [state.acceleration]]; }, { note: 'graphPulleyNote' }), duration: () => travelDuration(params, gravity), render, reset: () => reset(), defaults, viewBox: '200 0 400 500' });
  let selected = null, pausedForAnalysis = false;
  const hint = element('p', 'analysis-hint'); hint.id = 'pulley-selection-hint'; api.stageColumn.append(hint);
  const analysis = createBodyAnalysis({ parent: api.stageColumn, signal: api.signal, id: 'pulley-analysis', onClose: closeAnalysis });
  // An SVG containing interactive descendants must expose them to assistive technology.
  api.svg.setAttribute('role', 'group');
  api.svg.addEventListener('click', () => {
    if (selected) closeAnalysis(false);
  }, { signal: api.signal });
  function closeAnalysis(restoreFocus = true) {
    const target = selected === 'mass1' ? scene.left.group : scene.right.group;
    selected = null; pausedForAnalysis = false; analysis.hide(); render(api.clock.time); if (restoreFocus) target.focus({ preventScroll: true });
  }
  function selectBody(body) {
    pausedForAnalysis = api.clock.playing;
    if (api.clock.playing) api.clock.pause();
    selected = body; render(api.clock.time);
  }
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && selected && !event.defaultPrevented) { event.preventDefault(); closeAnalysis(); }
  }, { signal: api.signal });
  const leftMetric = metric(words.left, 'm', 's_1'), rightMetric = metric(words.right, 'm', 's_2');
  api.metrics.append(leftMetric.root, rightMetric.root);
  for (const key of ['mass1', 'mass2']) {
    const control = parameter({ id: `pulley-${key}`, label: words[key], symbol: key === 'mass1' ? 'm_1' : 'm_2', unit: 'kg', min: 1, max: 30, step: 0.5, value: params[key], signal: api.signal, onChange(value) { params[key] = value; pausedForAnalysis = false; api.clock.reset(); } });
    controls.set(key, control); api.parameters.append(control.root);
  }
  function reset() { pausedForAnalysis = false; api.clock.reset(); }
  function defaults() {
    pausedForAnalysis = false; params = { ...defaultParameters }; for (const [key, control] of controls) control.update(params[key]); api.clock.reset();
  }
  function buildScene() {
    const svg = api.svg;
    const defs = s('defs', {}, svg); const pattern = s('pattern', { id: 'pulley-grid', width: 30, height: 30, patternUnits: 'userSpaceOnUse' }, defs);
    s('circle', { cx: 1, cy: 1, r: .8, fill: '#c5cfbc', opacity: .7 }, pattern);
    s('rect', { width: 800, y: -20, height: 560, fill: 'url(#pulley-grid)' }, svg);
    s('path', { d: 'M 320 72 H 480 M 400 72 V 115', stroke: '#8d9f80', 'stroke-width': 4, fill: 'none' }, svg);
    for (let x = 325; x < 480; x += 15) s('path', { d: `M ${x} 72 l 9 -9`, stroke: '#8d9f80', 'stroke-width': 1.5 }, svg);
    s('circle', { cx: 400, cy: 156, r: 68, fill: '#d6dfcb', stroke: '#96a987', 'stroke-width': 2 }, svg);
    const wheel = s('g', {}, svg);
    s('circle', { cx: 400, cy: 156, r: 52, fill: '#e8eddf', stroke: '#adbd9d', 'stroke-width': 1.5 }, wheel);
    for (let angle = 0; angle < 360; angle += 60) s('path', { d: 'M 400 146 V 107', stroke: '#bfccb0', 'stroke-width': 2, transform: `rotate(${angle} 400 156)` }, wheel);
    s('circle', { cx: 400, cy: 156, r: 8, fill: '#829576', stroke: '#718568' }, svg);
    const rope = s('path', { stroke: '#b7925e', 'stroke-width': 3, fill: 'none' }, svg);
    const left = mass('#61816b', 'm₁', 'mass1'); const right = mass('#c38e60', 'm₂', 'mass2');
    const initial = 300;
    for (const x of [330, 470]) s('line', { x1: x - 48, x2: x + 48, y1: initial, y2: initial, stroke: '#a5b29b', 'stroke-dasharray': '3 5', opacity: .6 }, svg);
    s('line', { x1: 220, x2: 580, y1: 446, y2: 446, stroke: '#b8c3aa' }, svg);
    const forces = s('g', { class: 'canvas-forces', role: 'img', display: 'none', 'pointer-events': 'none' }, svg);
    const arrows = [-1, 1].map(direction => {
      const group = s('g', {}, forces);
      const shaft = s('line', { x1: 0, x2: 0, 'stroke-width': 6, 'stroke-linecap': 'round' }, group);
      const head = s('path', {}, group);
      const label = svgText(group, 0, 0, '', { class: 'force-label' });
      return { shaft, head, label, direction };
    });
    prepareSketchOutlines(api.svg);
    scene = { rope, left, right, wheel, forces, arrows };
    function mass(color, name, body) {
      const group = s('g', { role: 'button', tabindex: 0, class: 'selectable-mass', 'aria-describedby': hint.id, 'aria-controls': 'pulley-analysis' }, svg);
      group.addEventListener('click', event => { event.stopPropagation(); selectBody(body); }, { signal: api.signal });
      group.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectBody(body); }
        if (event.key === 'Escape' && selected) { event.preventDefault(); closeAnalysis(); }
      }, { signal: api.signal });
      s('rect', { x: -40, y: -8, width: 80, height: 72, fill: 'transparent' }, group);
      s('rect', { class: 'mass-body', x: -34, y: 0, width: 68, height: 55, rx: 9, fill: color }, group);
      svgText(group, 0, 22, name, { 'text-anchor': 'middle', class: 'mass-text' });
      const label = svgText(group, 0, 42, '', { 'text-anchor': 'middle', class: 'mass-text mass-value' });
      return { group, label };
    }
  }
  function render(time, { updateReadouts = true } = {}) {
    if (!scene) return;
    api.setSceneViewBox(selected ? '140 0 520 560' : '200 0 400 500');
    api.setGraphObstacles(selected
      ? [{ left: 210, top: 60, width: 400, height: 490 }]
      : [{ left: 310, top: 60, width: 180, height: 175 },
        { left: 285, top: 210, width: 90, height: 235 },
        { left: 425, top: 210, width: 90, height: 235 }]);
    if (api.clock.playing) pausedForAnalysis = false;
    for (const [body, mass] of [['mass1', scene.left], ['mass2', scene.right]]) {
      mass.group.setAttribute('aria-label', `${words.analyze}: ${words[body]}`);
      mass.group.setAttribute('aria-pressed', String(selected === body));
    }
    const data = selected ? bodyAnalysis(params, gravity, selected, words, {
      paused: pausedForAnalysis, cutoff: time >= travelDuration(params, gravity),
    }) : null;
    if (data && updateReadouts) analysis.update(data);
    scene.forces.setAttribute('display', data ? 'inline' : 'none');
    const state = pulleyState(params, time, gravity), shift = state.displacement * 65;
    const leftY = 300 + shift, rightY = 300 - shift;
    scene.rope.setAttribute('d', `M 330 ${leftY} V 156 A 70 70 0 0 1 470 156 V ${rightY}`);
    scene.left.group.setAttribute('transform', `translate(330 ${leftY})`); scene.right.group.setAttribute('transform', `translate(470 ${rightY})`);
    scene.left.label.textContent = `${format(params.mass1, 1)} kg`; scene.right.label.textContent = `${format(params.mass2, 1)} kg`;
    if (data) {
      const x = selected === 'mass1' ? 330 : 470, y = selected === 'mass1' ? leftY : rightY;
      const labelSide = selected === 'mass1' ? -1 : 1;
      scene.forces.setAttribute('transform', `translate(${x} ${y})`);
      scene.forces.setAttribute('aria-label', data.description);
      data.forces.forEach((force, index) => {
        const { shaft, head, label } = scene.arrows[index];
        const start = index === 0 ? 0 : 55, length = force.magnitude * data.pixelsPerNewton;
        const end = start + force.direction * length, arrowHead = Math.min(13, length / 2);
        const halfWidth = Math.min(8, length / 3), color = index === 0 ? '#174d77' : '#9a451b';
        shaft.setAttribute('y1', start); shaft.setAttribute('y2', end); shaft.setAttribute('stroke', color);
        head.setAttribute('d', `M 0 ${end} L ${-halfWidth} ${end - force.direction * arrowHead} H ${halfWidth} Z`);
        head.setAttribute('fill', color);
        label.setAttribute('x', labelSide * 16); label.setAttribute('y', start + force.direction * Math.max(12, length / 2));
        label.setAttribute('text-anchor', labelSide < 0 ? 'end' : 'start');
        label.textContent = `${force.symbol} = ${format(force.magnitude, 1)} N`;
      });
    }
    scene.wheel.setAttribute('transform', `rotate(${-shift / 70 * 180 / Math.PI} 400 156)`);
    // Report magnitudes; direction is communicated in the localized feedback.
    if (updateReadouts) {
      leftMetric.set(Math.abs(state.left)); rightMetric.set(Math.abs(state.right));
      const key = state.acceleration === 0 ? 'balanced' : time >= travelDuration(params, gravity) ? 'end' : time === 0 ? state.acceleration > 0 ? 'readyLeft' : 'readyRight' : state.acceleration > 0 ? 'leftDown' : 'rightDown';
      if (api.feedback.textContent !== words[key]) setText(api.feedback, words[key]);
      api.setDescription(words.description(format(params.mass1, 1), format(params.mass2, 1), words[key]));
    }
  }
  function setLanguage(next) {
    words = strings[next]; api.setLanguage(next); hint.textContent = words.selectHint;
    for (const [key, control] of controls) control.localize(words[key], translator(next)('kilograms'));
    leftMetric.localize(words.left, 'm'); rightMetric.localize(words.right, 'm');
    api.modelText.textContent = words.about; api.liveMark.textContent = words.caption; render(api.clock.time);
  }
  buildScene(); setLanguage(lang); api.clock.reset();
  return { reset, setLanguage, dispose: () => api.dispose() };
}
