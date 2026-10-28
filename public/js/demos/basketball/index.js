import { physicsConfig } from '../../config.js';
import { createExperiment } from '../../core/experiment.js';
import { parameter, metric } from '../../core/controls.js';
import { element, svgElement as s, svgText } from '../../core/dom.js';
import { translator, format } from '../../core/i18n.js';
import { defaultParameters, projectileState, flightDuration, shotOutcome, velocityComponents } from './physics.js';
import { strings } from './strings.js';
export function mount({ root, lang }) {
  let params = { ...defaultParameters }, previous = null, showPrevious = true;
  const gravity = physicsConfig.gravity;
  let words = strings[lang], t = translator(lang), scene = null;
  const controls = new Map();
  const api = createExperiment({ root, lang, duration: () => flightDuration(params, gravity), render, reset: () => reset(), defaults });
  const xMetric = metric(words.x, t('meters')), yMetric = metric(words.y, t('meters'));
  api.metrics.append(xMetric.root, yMetric.root);
  const specs = [
    { key: 'speed', min: 1, max: 15, step: 0.1, unit: 'ms' },
    { key: 'angle', min: 5, max: 85, step: 1, unit: '°' },
    { key: 'releaseHeight', min: 0.5, max: 5, step: 0.1, unit: 'meters' },
    { key: 'hoopHeight', min: 0.5, max: 5, step: 0.1, unit: 'meters' },
    { key: 'distance', min: 1, max: 15, step: 0.1, unit: 'meters' },
  ];
  const advanced = element('details', 'advanced-controls'); const summary = element('summary', '', t('advanced')); const fields = element('div', 'advanced-fields');
  advanced.append(summary, fields);
  for (const [index, spec] of specs.entries()) {
    const control = parameter({ ...spec, id: `basketball-${spec.key}`, label: words[spec.key], unit: spec.unit === '°' ? '°' : t(spec.unit), value: params[spec.key], signal: api.signal, onChange(v) {
      remember(); params[spec.key] = v; buildScene(); api.clock.reset();
    } });
    controls.set(spec.key, control); (index < 2 ? api.parameters : fields).append(control.root);
  }
  api.parameters.append(advanced);
  const compare = element('label', 'compare-toggle'); const checkbox = element('input'); checkbox.type = 'checkbox'; checkbox.checked = true;
  const compareText = element('span', '', words.compare); compare.append(checkbox, compareText); api.parameters.append(compare);
  checkbox.addEventListener('change', () => { showPrevious = checkbox.checked; render(api.clock.time); }, { signal: api.signal });
  function remember() { if (api.clock.time > 0) previous = { params: { ...params }, time: api.clock.time }; }
  function reset() { api.clock.reset(); }
  function defaults() {
    previous = null; params = { ...defaultParameters }; for (const [key, control] of controls) control.update(params[key]);
    buildScene(); api.clock.reset();
  }
  function buildScene() {
    const svg = api.svg; svg.replaceChildren();
    const end = flightDuration(params, gravity), final = projectileState(params, end, gravity);
    const { vy } = velocityComponents(params);
    const maxX = Math.max(params.distance + 1.1, final.x + 0.5, 5.5);
    const maxY = Math.max(params.releaseHeight + vy * vy / (2 * gravity), params.hoopHeight, 3) + 0.7;
    const scale = Math.min(665 / maxX, 310 / maxY);
    const X = x => 65 + x * scale, Y = y => 410 - y * scale;
    const defs = s('defs', {}, svg); const pattern = s('pattern', { id: 'shot-grid', width: 30, height: 30, patternUnits: 'userSpaceOnUse' }, defs);
    s('circle', { cx: 1, cy: 1, r: 0.8, fill: '#c9cfbe', opacity: 0.65 }, pattern);
    s('rect', { x: 0, y: 0, width: 800, height: 480, fill: 'url(#shot-grid)' }, svg);
    const clip = s('clipPath', { id: 'shot-clip' }, defs); s('rect', { x: 40, y: 65, width: 715, height: 347 }, clip);
    s('line', { x1: 45, y1: 410, x2: 755, y2: 410, stroke: '#b2bca5', 'stroke-width': 1.5 }, svg);
    const gridStep = maxX > 16 ? 5 : maxX > 8 ? 2 : 1;
    for (let x = 0; x <= maxX; x += gridStep) {
      s('line', { x1: X(x), y1: 410, x2: X(x), y2: 416, stroke: '#aab79e' }, svg);
      svgText(svg, X(x), 435, `${x}`, { 'text-anchor': 'middle', class: 'dimension' });
    }
    svgText(svg, 754, 435, 'm', { 'text-anchor': 'end', class: 'dimension' });
    s('line', { x1: X(0), x2: X(0), y1: Y(params.releaseHeight), y2: 410, stroke: '#aebca3', 'stroke-dasharray': '4 5' }, svg);
    svgText(svg, X(0) - 9, (Y(params.releaseHeight) + 410) / 2, `${format(params.releaseHeight, 1)} m`, { 'text-anchor': 'end', class: 'dimension height-label' });
    s('circle', { cx: X(0), cy: 410, r: 3, fill: '#668363' }, svg);
    const hx = X(params.distance), hy = Y(params.hoopHeight);
    s('path', { d: `M ${hx + 24} ${hy - 35} v ${410 - hy + 35} h -30`, stroke: '#8a9e80', 'stroke-width': 4, fill: 'none' }, svg);
    s('line', { x1: hx + 24, x2: hx + 24, y1: hy - 38, y2: hy + 7, stroke: '#607957', 'stroke-width': 5 }, svg);
    s('path', { d: `M ${hx - 15} ${hy + 2} l 6 28 h 19 l 6 -28 M ${hx - 12} ${hy + 13} l 25 10 M ${hx - 8} ${hy + 23} l 24 -10`, fill: 'none', stroke: '#9eac92', 'stroke-width': 1.4 }, svg);
    s('ellipse', { cx: hx, cy: hy, rx: 19, ry: 4, fill: 'none', stroke: '#bb8054', 'stroke-width': 3 }, svg);
    svgText(svg, hx + 34, hy + 6, `${format(params.hoopHeight, 1)} m`, { class: 'dimension height-label' });
    const paths = s('g', { 'clip-path': 'url(#shot-clip)' }, svg);
    const old = s('path', { fill: 'none', stroke: '#8c9b8b', opacity: 0.5, 'stroke-width': 2, 'stroke-dasharray': '3 7' }, paths);
    const path = s('path', { fill: 'none', stroke: '#6f8e65', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, paths);
    const ball = s('g', {}, svg);
    s('circle', { r: 12, fill: '#e3a06a', stroke: '#b77a4b', 'stroke-width': 1 }, ball);
    s('path', { d: 'M -10 -6 Q 0 5 10 -6 M -11 4 L 11 4 M 0 -12 Q -6 0 2 12', fill: 'none', stroke: '#a4673e', 'stroke-width': 1 }, ball);
    scene = { X, Y, old, path, ball };
  }
  function pathData(p, time) {
    const points = [];
    for (let i = 0; i <= 100; i++) {
      const state = projectileState(p, Math.min(time, flightDuration(p, gravity)) * i / 100, gravity);
      points.push(`${i ? 'L' : 'M'} ${scene.X(state.x).toFixed(2)} ${scene.Y(Math.max(0, state.y)).toFixed(2)}`);
    }
    return points.join(' ');
  }
  function render(time) {
    if (!scene) return;
    const state = projectileState(params, time, gravity), outcome = shotOutcome(params, gravity);
    scene.path.setAttribute('d', pathData(params, time));
    scene.old.setAttribute('d', previous && showPrevious ? pathData(previous.params, previous.time) : '');
    scene.ball.setAttribute('transform', `translate(${scene.X(state.x)} ${scene.Y(Math.max(0, state.y))}) rotate(${time * 110})`);
    xMetric.set(state.x); yMetric.set(Math.max(0, state.y));
    const key = time === 0 ? 'ready' : time >= outcome.time ? outcome.key : time >= flightDuration(params, gravity) ? 'short' : 'moving';
    if (api.feedback.textContent !== words[key]) api.feedback.textContent = words[key];
    api.setDescription(words.description(format(state.x), format(Math.max(0, state.y))));
  }
  function setLanguage(next) {
    words = strings[next]; t = translator(next); api.setLanguage(next);
    for (const spec of specs) controls.get(spec.key).localize(words[spec.key], spec.unit === '°' ? '°' : t(spec.unit));
    xMetric.localize(words.x, t('meters')); yMetric.localize(words.y, t('meters'));
    summary.textContent = t('advanced'); compareText.textContent = words.compare; api.modelText.textContent = words.about; api.liveMark.textContent = words.caption;
    render(api.clock.time);
  }
  buildScene(); setLanguage(lang); api.clock.reset();
  return { reset, setLanguage, dispose: () => api.dispose() };
}
