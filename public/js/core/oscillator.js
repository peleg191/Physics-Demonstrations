import { physicsConfig } from '../config.js';
import { createExperiment } from './experiment.js';
import { createBodyAnalysis } from './body-analysis.js';
import { oscillatorAnalysis } from './oscillator-analysis.js';
import { parameter, metric } from './controls.js';
import { element, svgElement as s, svgText } from './dom.js';
import { translator, format } from './i18n.js';

// Shared playback and selection; each oscillator supplies its own physical model.
export function mountOscillator({ root, lang, kind, strings, defaultParameters, oscillatorState, duration, specs }) {
  const pendulum = kind === 'pendulum', gravity = physicsConfig.gravity;
  let params = { ...defaultParameters }, words = strings[lang], selected = false, paused = false, scene;
  const controls = new Map();
  const api = createExperiment({ root, lang, duration: () => duration(params, gravity), render, reset, defaults });
  api.svg.setAttribute('role', 'group');
  const hint = element('p', 'analysis-hint'); hint.id = `${kind}-hint`; api.stageColumn.append(hint);
  const analysis = createBodyAnalysis({ parent: api.stageColumn, signal: api.signal, id: `${kind}-analysis`, onClose: close });
  const position = metric(words.position, pendulum ? '°' : 'm');
  const velocity = metric(words.velocity, pendulum ? 'rad/s' : 'm/s'), period = metric(words.period, 's');
  api.metrics.append(position.root, velocity.root, period.root);
  for (const spec of specs) {
    const control = parameter({ ...spec, id: `${kind}-${spec.key}`, label: words[spec.key], value: params[spec.key], signal: api.signal,
      onChange(value) { params[spec.key] = value; reset(); } });
    controls.set(spec.key, control); api.parameters.append(control.root);
  }
  function reset() { paused = false; api.clock.reset(); }
  function defaults() { params = { ...defaultParameters }; for (const [key, control] of controls) control.update(params[key]); reset(); }
  function close() { selected = false; paused = false; analysis.hide(); render(api.clock.time); scene.body.focus(); }
  function select() { paused = api.clock.playing; if (paused) api.clock.pause(); selected = true; render(api.clock.time); }
  function isBody(node) { for (; node && node !== api.svg; node = node.parentNode) if (node === scene.body) return true; return false; }
  api.svg.addEventListener('click', event => { if (isBody(event.target)) select(); else if (selected) close(); }, { signal: api.signal });
  api.svg.addEventListener('keydown', event => {
    if (isBody(event.target) && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); select(); }
  }, { signal: api.signal });
  root.addEventListener('keydown', event => { if (event.key === 'Escape' && selected && !event.defaultPrevented) { event.preventDefault(); close(); } }, { signal: api.signal });
  function buildScene() {
    const svg = api.svg;
    s('path', { d: pendulum ? 'M 300 80 H 500 M 400 80 V 100' : 'M 115 180 V 350 H 700', stroke: '#839775', 'stroke-width': 4, fill: 'none' }, svg);
    const reference = s('line', { x1: 400, x2: 400, y1: pendulum ? 100 : 230, y2: pendulum ? 410 : 375, stroke: '#9caa91', 'stroke-dasharray': '5 6' }, svg);
    const connector = s('path', { fill: 'none', stroke: pendulum ? '#ad8959' : '#6f8e65', 'stroke-width': 3 }, svg);
    const body = s('g', { class: 'selectable-mass', role: 'button', tabindex: 0, 'aria-controls': `${kind}-analysis`, 'aria-describedby': hint.id }, svg);
    if (pendulum) s('circle', { class: 'mass-body', r: 19, fill: '#c38e60' }, body);
    else s('rect', { class: 'mass-body', x: -30, y: -30, width: 60, height: 60, rx: 7, fill: '#61816b' }, body);
    svgText(body, 0, 6, 'm', { class: 'mass-text', 'text-anchor': 'middle' });
    const forces = s('g', { 'pointer-events': 'none', 'aria-hidden': 'true' }, svg);
    const force = s('path', { fill: 'none', stroke: '#9a451b', 'stroke-width': 4 }, forces);
    const label = svgText(forces, 0, 0, '', { 'text-anchor': 'middle' });
    scene = { body, reference, connector, forces, force, label };
  }
  function render(time) {
    if (!scene) return;
    const state = oscillatorState(params, time, gravity);
    let x, y, dx, dy;
    if (pendulum) {
      const length = params.length * 95;
      x = 400 + length * Math.sin(state.position); y = 100 + length * Math.cos(state.position);
      scene.connector.setAttribute('d', `M 400 100 L ${x} ${y}`);
      scene.reference.setAttribute('y2', 100 + length);
      const restoring = -state.position / (params.amplitude * Math.PI / 180) * 75;
      dx = restoring * Math.cos(state.position); dy = -restoring * Math.sin(state.position);
    } else {
      x = 400 + state.position * 180; y = 320;
      const end = x - 30, points = ['M 115 320 L 135 320'];
      for (let n = 0; n <= 20; n++) points.push(`L ${135 + (end - 155) * n / 20} ${n === 0 || n === 20 ? 320 : 320 + (n % 2 ? -12 : 12)}`);
      points.push(`L ${end} 320`); scene.connector.setAttribute('d', points.join(' '));
      dx = -state.position / params.amplitude * 85; dy = 0;
    }
    scene.body.setAttribute('transform', `translate(${x} ${y})`);
    scene.body.setAttribute('aria-label', words.block); scene.body.setAttribute('aria-pressed', String(selected));
    scene.forces.setAttribute('display', selected ? 'inline' : 'none');
    const length = Math.hypot(dx, dy), head = Math.min(10, length / 2), ux = length ? dx / length : 0, uy = length ? dy / length : 0;
    scene.force.setAttribute('d', `M ${x} ${y} l ${dx} ${dy} m ${-ux * head - uy * head / 2} ${-uy * head + ux * head / 2} l ${ux * head + uy * head / 2} ${uy * head - ux * head / 2} l ${-ux * head + uy * head / 2} ${-uy * head - ux * head / 2}`);
    scene.label.setAttribute('x', x + dx / 2); scene.label.setAttribute('y', y + dy / 2 - 40); scene.label.textContent = words.force;
    if (api.clock.playing) paused = false;
    const ended = time >= duration(params, gravity);
    if (selected) analysis.update(oscillatorAnalysis(kind, words, paused, ended));
    position.set(pendulum ? state.position * 180 / Math.PI : state.position); velocity.set(state.velocity); period.set(state.period);
    api.feedback.textContent = ended ? words.end : words.moving;
    api.setDescription(`${words.caption}. ${words.position}: ${format(pendulum ? state.position * 180 / Math.PI : state.position)} ${pendulum ? '°' : 'm'}. ${ended ? words.end : words.moving}`);
  }
  function setLanguage(next) {
    words = strings[next]; api.setLanguage(next); hint.textContent = words.hint;
    for (const spec of specs) controls.get(spec.key).localize(words[spec.key], spec.key === 'mass' ? translator(next)('kilograms') : spec.unit);
    position.localize(words.position, pendulum ? '°' : 'm'); velocity.localize(words.velocity, pendulum ? 'rad/s' : 'm/s'); period.localize(words.period, 's');
    api.modelText.textContent = words.about; api.liveMark.textContent = words.caption; render(api.clock.time);
  }
  buildScene(); setLanguage(lang); api.clock.reset();
  return { reset, setLanguage, dispose: () => api.dispose() };
}
