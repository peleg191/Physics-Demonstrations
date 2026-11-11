import { physicsConfig } from '../../config.js';
import { createExperiment } from '../../core/experiment.js';
import { createBodyAnalysis } from '../../core/body-analysis.js';
import { motionModel } from '../../core/motion-graphs.js';
import { parameter, metric } from '../../core/controls.js';
import { element, setText, svgElement as s, svgText } from '../../core/dom.js';
import { prepareSketchOutlines } from '../../core/sketch.js';
import { format, translator } from '../../core/i18n.js';
import { defaultParameters, elevatorState, duration } from './physics.js';
import { strings } from './strings.js';
import { bodyAnalysis } from './analysis.js';

export function mount({ root, lang }) {
  let params = { ...defaultParameters }, words = strings[lang], selected = false, paused = false;
  const gravity = physicsConfig.gravity, controls = new Map();
  const api = createExperiment({ root, lang, showQuizForces: () => { selected = true; }, system: 'elevator', viewBox: '0 0 640 460',
    duration: () => duration, render, reset, defaults,
    motion: () => motionModel(time => { const state = elevatorState(params, time, gravity); return [[state.position], [state.velocity], [state.acceleration]]; }, { components: ['graphVertical'] }),
  });
  api.svg.setAttribute('role', 'group');
  api.setGraphObstacles([{ left: 175, top: 50, width: 290, height: 355 }]);
  const hint = element('p', 'analysis-hint'); hint.id = 'elevator-hint'; api.stageColumn.append(hint);
  const analysis = createBodyAnalysis({ parent: api.stageColumn, signal: api.signal, id: 'elevator-analysis', onClose: close });
  const readings = [['position', 'm', 'y'], ['velocity', 'm/s', 'v'], ['normal', 'N', 'N']].map(([key, unit, symbol]) => {
    const reading = metric(words[key], unit, symbol); api.metrics.append(reading.root); return { ...reading, key, unit };
  });
  const specs = [
    { key: 'mass', symbol: 'm', min: 15, max: 150, step: 1, unit: 'kg' },
    { key: 'acceleration', symbol: 'a', min: -gravity, max: gravity, step: gravity / 100, unit: 'm/s²' },
  ];
  for (const spec of specs) {
    const control = parameter({ ...spec, id: `elevator-${spec.key}`, label: words[spec.key], value: params[spec.key], signal: api.signal,
      onChange(value) { params[spec.key] = value; reset(); } });
    controls.set(spec.key, control); api.parameters.append(control.root);
  }
  function reset() { paused = false; api.clock.reset(); }
  function defaults() { params = { ...defaultParameters }; for (const [key, control] of controls) control.update(params[key]); reset(); }
  function close() { selected = false; paused = false; analysis.hide(); render(api.clock.time); person.focus({ preventScroll: true }); }
  function select() { paused = api.clock.playing; if (paused) api.clock.pause(); selected = true; render(api.clock.time); }

  // The cabin is a moving reference for the artwork only. Equations use the Earth frame.
  s('path', { d: 'M 165 20 V 425 M 475 20 V 425', stroke: 'var(--scene-structure, #839775)', 'stroke-width': 5 }, api.svg);
  const markers = s('g', { 'aria-hidden': 'true' }, api.svg);
  const markerLines = Array.from({ length: 10 }, () => s('path', { stroke: 'var(--scene-structure, #839775)', 'stroke-width': 2 }, markers));
  s('rect', { x: 185, y: 55, width: 270, height: 335, rx: 12, fill: 'var(--scene-surface, #dce3d1)', stroke: 'var(--scene-green, #61816b)', 'stroke-width': 4 }, api.svg);
  s('rect', { x: 202, y: 70, width: 236, height: 300, rx: 6, fill: 'var(--scene-surface-inset, #f4efe5)', stroke: 'var(--scene-structure, #839775)', 'stroke-width': 2 }, api.svg);
  s('rect', { x: 270, y: 340, width: 100, height: 22, rx: 5, fill: 'var(--scene-green, #61816b)' }, api.svg);
  const scaleLabel = svgText(api.svg, 320, 357, '', { class: 'scale-reading', 'text-anchor': 'middle', fill: '#fff', 'font-size': 13 });
  const person = s('g', { class: 'selectable-mass', role: 'button', tabindex: 0, 'aria-controls': 'elevator-analysis', 'aria-describedby': hint.id }, api.svg);
  s('rect', { class: 'mass-hit', x: 267, y: 175, width: 106, height: 165, rx: 25, fill: 'transparent' }, person);
  s('circle', { class: 'mass-body', cx: 320, cy: 200, r: 22, fill: 'var(--scene-warm, #d3a374)', stroke: 'var(--scene-warm-edge, #775c45)', 'stroke-width': 2 }, person);
  s('path', { d: 'M 300 232 Q 320 220 340 232 L 346 281 H 294 Z', fill: 'var(--scene-green, #61816b)', stroke: 'var(--scene-edge, #3c5e49)', 'stroke-width': 2 }, person);
  s('path', { d: 'M 301 239 L 283 280 M 339 239 L 357 280 M 306 282 L 302 333 H 291 M 334 282 L 338 333 H 349', fill: 'none', stroke: 'var(--scene-warm-edge, #775c45)', 'stroke-width': 9, 'stroke-linecap': 'round' }, person);
  const forces = s('g', { 'pointer-events': 'none', 'aria-hidden': 'true' }, api.svg);
  const arrows = ['var(--scene-force-blue, #174d77)', 'var(--scene-force-weight, #9a451b)'].map(color => ({
    path: s('path', { stroke: color, fill: 'none', 'stroke-width': 4 }, forces),
    label: svgText(forces, 0, 0, '', { class: 'force-label', 'text-anchor': 'middle' }),
  }));
  s('path', { d: 'M 510 155 V 85 l -6 10 m 6 -10 l 6 10', fill: 'none', stroke: 'var(--scene-green, #61816b)', 'stroke-width': 2 }, api.svg);
  svgText(api.svg, 530, 90, '+y');
  const accelerationLabel = svgText(api.svg, 320, 42, '', { 'text-anchor': 'middle' });
  prepareSketchOutlines(api.svg);
  function isPerson(node) { for (; node && node !== api.svg; node = node.parentNode) if (node === person) return true; return false; }
  api.svg.addEventListener('click', event => { if (isPerson(event.target)) select(); else if (selected) close(); }, { signal: api.signal });
  api.svg.addEventListener('keydown', event => {
    if (isPerson(event.target) && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); select(); }
  }, { signal: api.signal });
  root.addEventListener('keydown', event => { if (event.key === 'Escape' && selected && !event.defaultPrevented) { event.preventDefault(); close(); } }, { signal: api.signal });
  function render(time, { updateReadouts = true } = {}) {
    const state = elevatorState(params, time, gravity);
    // Positive cabin displacement makes fixed shaft markers move down relative to it.
    const offset = ((state.position * 14) % 48 + 48) % 48;
    markerLines.forEach((line, index) => {
      const y = index * 48 + offset;
      line.setAttribute('d', y > 20 && y < 425 ? `M 150 ${y} H 180 M 460 ${y} H 490` : '');
    });
    person.setAttribute('aria-label', `${words.person}. N = ${format(state.normal)} N; mg = ${format(state.weight)} N`);
    person.setAttribute('aria-pressed', String(selected));
    forces.setAttribute('display', selected ? 'inline' : 'none');
    // Both forces use the same linear scale. Zero normal force has a label and no arrow.
    const forceScale = 95 / Math.max(state.weight, state.normal);
    [state.normal, state.weight].forEach((force, index) => {
      const dy = force * forceScale * (index === 0 ? -1 : 1), y = 265 + dy;
      const head = Math.min(10, Math.abs(dy) / 2), direction = index === 0 ? -1 : 1;
      arrows[index].path.setAttribute('d', force === 0 ? '' : `M 320 265 V ${y} m -6 ${-direction * head} l 6 ${direction * head} l 6 ${-direction * head}`);
      arrows[index].label.setAttribute('x', index === 0 ? 393 : 246);
      arrows[index].label.setAttribute('y', y + (index === 0 ? -8 : 18));
      setText(arrows[index].label, `${index === 0 ? 'N' : 'mg'} = ${format(force, 1)} N`);
    });
    if (api.clock.playing) paused = false;
    if (updateReadouts) {
      setText(scaleLabel, `${format(state.normal, 1)} N`);
      setText(accelerationLabel, `a = ${format(state.acceleration, 2)} m/s²`);
      for (const reading of readings) reading.set(state[reading.key]);
      const message = state.normal === 0 ? words.freefall : state.acceleration > 0 ? words.upward : state.acceleration < 0 ? words.downward : words.rest;
      setText(api.feedback, time >= duration ? words.cutoff : message);
      api.setDescription(`${words.caption}. ${message} ${words.normal}: ${format(state.normal)} N. ${words.position}: ${format(state.position)} m.`);
      if (selected) analysis.update(bodyAnalysis(words, state, paused, time >= duration));
    }
  }
  function setLanguage(next) {
    words = strings[next]; api.setLanguage(next);
    for (const spec of specs) controls.get(spec.key).localize(words[spec.key], spec.key === 'mass' ? translator(next)('kilograms') : spec.unit);
    for (const reading of readings) reading.localize(words[reading.key], reading.unit);
    hint.textContent = words.hint; api.modelText.textContent = words.about; api.liveMark.textContent = words.caption;
    render(api.clock.time);
  }
  setLanguage(lang); api.clock.reset();
  return { reset, setLanguage, dispose: () => api.dispose() };
}
