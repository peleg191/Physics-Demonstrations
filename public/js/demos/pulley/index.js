import { physicsConfig } from '../../config.js';
import { createExperiment } from '../../core/experiment.js';
import { parameter, metric } from '../../core/controls.js';
import { svgElement as s, svgText } from '../../core/dom.js';
import { translator, format } from '../../core/i18n.js';
import { defaultParameters, pulleyState, travelDuration } from './physics.js';
import { strings } from './strings.js';
export function mount({ root, lang }) {
  let params = { ...defaultParameters }, words = strings[lang], scene;
  const gravity = physicsConfig.gravity; const controls = new Map();
  const api = createExperiment({ root, lang, duration: () => travelDuration(params, gravity), render, reset: () => reset(), defaults, mobileViewBox: '200 0 400 480' });
  const leftMetric = metric(words.left, 'm'), rightMetric = metric(words.right, 'm');
  api.metrics.append(leftMetric.root, rightMetric.root);
  for (const key of ['mass1', 'mass2']) {
    const control = parameter({ id: `pulley-${key}`, label: words[key], unit: 'kg', min: 1, max: 30, step: 0.5, value: params[key], signal: api.signal, onChange(value) { params[key] = value; api.clock.reset(); } });
    controls.set(key, control); api.parameters.append(control.root);
  }
  function reset() { api.clock.reset(); }
  function defaults() {
    params = { ...defaultParameters }; for (const [key, control] of controls) control.update(params[key]); api.clock.reset();
  }
  function buildScene() {
    const svg = api.svg;
    const defs = s('defs', {}, svg); const pattern = s('pattern', { id: 'pulley-grid', width: 30, height: 30, patternUnits: 'userSpaceOnUse' }, defs);
    s('circle', { cx: 1, cy: 1, r: .8, fill: '#c5cfbc', opacity: .7 }, pattern);
    s('rect', { width: 800, height: 480, fill: 'url(#pulley-grid)' }, svg);
    s('path', { d: 'M 320 72 H 480 M 400 72 V 115', stroke: '#8d9f80', 'stroke-width': 4, fill: 'none' }, svg);
    for (let x = 325; x < 480; x += 15) s('path', { d: `M ${x} 72 l 9 -9`, stroke: '#8d9f80', 'stroke-width': 1.5 }, svg);
    s('circle', { cx: 400, cy: 156, r: 68, fill: '#d6dfcb', stroke: '#96a987', 'stroke-width': 2 }, svg);
    const wheel = s('g', {}, svg);
    s('circle', { cx: 400, cy: 156, r: 52, fill: '#e8eddf', stroke: '#adbd9d', 'stroke-width': 1.5 }, wheel);
    for (let angle = 0; angle < 360; angle += 60) s('path', { d: 'M 400 146 V 107', stroke: '#bfccb0', 'stroke-width': 2, transform: `rotate(${angle} 400 156)` }, wheel);
    s('circle', { cx: 400, cy: 156, r: 8, fill: '#829576', stroke: '#718568' }, svg);
    const rope = s('path', { stroke: '#b7925e', 'stroke-width': 3, fill: 'none' }, svg);
    const left = mass('#61816b', 'm₁'); const right = mass('#c38e60', 'm₂');
    const initial = 300;
    for (const x of [330, 470]) s('line', { x1: x - 48, x2: x + 48, y1: initial, y2: initial, stroke: '#a5b29b', 'stroke-dasharray': '3 5', opacity: .6 }, svg);
    s('line', { x1: 220, x2: 580, y1: 446, y2: 446, stroke: '#b8c3aa' }, svg);
    scene = { rope, left, right, wheel };
    function mass(color, name) {
      const group = s('g', {}, svg);
      s('rect', { x: -34, y: 0, width: 68, height: 55, rx: 9, fill: color }, group);
      svgText(group, 0, 22, name, { 'text-anchor': 'middle', class: 'mass-text' });
      const label = svgText(group, 0, 42, '', { 'text-anchor': 'middle', class: 'mass-text mass-value' });
      return { group, label };
    }
  }
  function render(time) {
    if (!scene) return;
    const state = pulleyState(params, time, gravity), shift = state.displacement * 65;
    const leftY = 300 + shift, rightY = 300 - shift;
    scene.rope.setAttribute('d', `M 330 ${leftY} V 156 A 70 70 0 0 1 470 156 V ${rightY}`);
    scene.left.group.setAttribute('transform', `translate(330 ${leftY})`); scene.right.group.setAttribute('transform', `translate(470 ${rightY})`);
    scene.left.label.textContent = `${format(params.mass1, 1)} kg`; scene.right.label.textContent = `${format(params.mass2, 1)} kg`;
    scene.wheel.setAttribute('transform', `rotate(${-shift / 70 * 180 / Math.PI} 400 156)`);
    // Report magnitudes; direction is communicated in the localized feedback.
    leftMetric.set(Math.abs(state.left)); rightMetric.set(Math.abs(state.right));
    const key = state.acceleration === 0 ? 'balanced' : time >= travelDuration(params, gravity) ? 'end' : time === 0 ? state.acceleration > 0 ? 'readyLeft' : 'readyRight' : state.acceleration > 0 ? 'leftDown' : 'rightDown';
    if (api.feedback.textContent !== words[key]) api.feedback.textContent = words[key];
    api.setDescription(words.description(format(params.mass1, 1), format(params.mass2, 1), words[key]));
  }
  function setLanguage(next) {
    words = strings[next]; api.setLanguage(next);
    for (const [key, control] of controls) control.localize(words[key], translator(next)('kilograms'));
    leftMetric.localize(words.left, 'm'); rightMetric.localize(words.right, 'm');
    api.modelText.textContent = words.about; api.liveMark.textContent = words.caption; render(api.clock.time);
  }
  buildScene(); setLanguage(lang); api.clock.reset();
  return { reset, setLanguage, dispose: () => api.dispose() };
}
