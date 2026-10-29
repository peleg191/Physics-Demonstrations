import { physicsConfig } from '../../config.js';
import { createExperiment } from '../../core/experiment.js';
import { createBodyAnalysis } from '../../core/body-analysis.js';
import { parameter, metric } from '../../core/controls.js';
import { element, svgElement as s, svgText } from '../../core/dom.js';
import { translator, format } from '../../core/i18n.js';
import { defaultParameters, inclineState, travelDuration } from './physics.js';
import { strings } from './strings.js';
import { bodyAnalysis } from './analysis.js';
export function mount({ root, lang }) {
  let params = { ...defaultParameters }, words = strings[lang], selected = false, paused = false, scene;
  const gravity = physicsConfig.gravity, controls = new Map();
  const api = createExperiment({ root, lang, duration: () => travelDuration(params, gravity), render, reset, defaults });
  api.svg.setAttribute('role', 'group');
  const hint = element('p', 'analysis-hint'); hint.id = 'incline-hint'; api.stageColumn.append(hint);
  const analysis = createBodyAnalysis({ parent: api.stageColumn, signal: api.signal, id: 'incline-analysis', onClose: close });
  const distance = metric(words.distance, 'm'), acceleration = metric(words.acceleration, 'm/s²'), critical = metric(words.critical, '°');
  api.metrics.append(distance.root, acceleration.root, critical.root);
  const specs = [
    { key: 'mass', min: 1, max: 30, step: 0.5, unit: 'kg' },
    { key: 'angle', min: 0, max: 60, step: 0.1, unit: '°' },
    { key: 'staticFriction', min: 0, max: 1, step: 0.01, unit: '' },
    { key: 'kineticFriction', min: 0, max: 1, step: 0.01, unit: '' },
  ];
  for (const spec of specs) {
    const control = parameter({ ...spec, id: `incline-${spec.key}`, label: words[spec.key], value: params[spec.key], signal: api.signal, onChange(value) {
      params[spec.key] = value;
      if (params.kineticFriction > params.staticFriction) {
        const other = spec.key === 'kineticFriction' ? 'staticFriction' : 'kineticFriction';
        params[other] = value; controls.get(other).update(value);
      }
      buildScene(); reset();
    } });
    controls.set(spec.key, control); api.parameters.append(control.root);
  }
  const coefficientNote = element('p', 'panel-note'); api.parameters.append(coefficientNote);
  function reset() { paused = false; api.clock.reset(); }
  function defaults() {
    params = { ...defaultParameters }; for (const [key, control] of controls) control.update(params[key]); buildScene(); reset();
  }
  function close() { selected = false; paused = false; analysis.hide(); render(api.clock.time); scene.block.focus(); }
  function select() {
    paused = api.clock.playing; if (paused) api.clock.pause(); selected = true; render(api.clock.time);
  }
  function isBlock(node) { for (; node && node !== api.svg; node = node.parentNode) if (node === scene.block) return true; return false; }
  api.svg.addEventListener('click', event => { if (isBlock(event.target)) select(); else if (selected) close(); }, { signal: api.signal });
  api.svg.addEventListener('keydown', event => {
    if (isBlock(event.target) && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); select(); }
  }, { signal: api.signal });
  root.addEventListener('keydown', event => { if (event.key === 'Escape' && selected && !event.defaultPrevented) { event.preventDefault(); close(); } }, { signal: api.signal });
  function buildScene() {
    api.svg.replaceChildren();
    const alpha = params.angle * Math.PI / 180, c = Math.cos(alpha), sn = Math.sin(alpha);
    // One physical metre always has the same scale along either screen axis.
    const scale = Math.min(95, 300 / (6 * Math.max(sn, 0.01))), startX = 120, startY = 100;
    const endX = startX + 6 * scale * c, endY = startY + 6 * scale * sn;
    s('path', { d: `M ${startX} ${startY} L ${endX} ${endY} L ${startX} ${endY} Z`, fill: '#dce3d1', stroke: '#839775', 'stroke-width': 2 }, api.svg);
    s('line', { x1: startX, y1: startY, x2: startX + 95, y2: startY, stroke: '#8b9982', 'stroke-dasharray': '4 4' }, api.svg);
    svgText(api.svg, startX + 65, startY + 18, `${format(params.angle, 1)}°`);
    const block = s('g', { class: 'selectable-mass', role: 'button', tabindex: 0, 'aria-controls': 'incline-analysis', 'aria-describedby': hint.id }, api.svg);
    s('rect', { class: 'mass-body', x: -24, y: -48, width: 48, height: 48, rx: 5, fill: '#61816b' }, block);
    svgText(block, 0, -18, 'm', { class: 'mass-text', 'text-anchor': 'middle' });
    const forces = s('g', { 'pointer-events': 'none', 'aria-hidden': 'true' }, api.svg);
    const arrows = ['#9a451b', '#174d77', '#7a4e86'].map(color => {
      const path = s('path', { stroke: color, fill: 'none', 'stroke-width': 4 }, forces);
      const label = svgText(forces, 0, 0, '', { 'text-anchor': 'middle' });
      return { path, label };
    });
    scene = { c, sn, scale, startX, startY, block, forces, arrows };
  }
  function render(time) {
    if (!scene) return;
    const state = inclineState(params, time, gravity), { c, sn, scale, startX, startY } = scene;
    const x = startX + (0.5 + state.displacement) * scale * c, y = startY + (0.5 + state.displacement) * scale * sn;
    scene.block.setAttribute('transform', `translate(${x} ${y}) rotate(${params.angle})`);
    scene.block.setAttribute('aria-label', words.block); scene.block.setAttribute('aria-pressed', String(selected));
    scene.forces.setAttribute('display', selected ? 'inline' : 'none');
    if (api.clock.playing) paused = false;
    if (selected) {
      analysis.update(bodyAnalysis(words, state, paused, time >= travelDuration(params, gravity)));
      // All force arrows share the same scale, set by weight to fit the scene.
      const forceScale = 85 / state.weight, cx = x + 24 * sn, cy = y - 24 * c;
      const vectors = [[0, state.weight, 'mg'], [state.normal * sn, -state.normal * c, 'N'], [-state.friction * c, -state.friction * sn, state.resting ? 'fₛ' : 'fₖ']];
      vectors.forEach(([fx, fy, name], index) => {
        const { path, label } = scene.arrows[index], length = Math.hypot(fx, fy), dx = fx * forceScale, dy = fy * forceScale;
        const ux = length ? fx / length : 0, uy = length ? fy / length : 0, head = Math.min(10, length * forceScale / 2);
        path.setAttribute('d', `M ${cx} ${cy} l ${dx} ${dy} m ${-ux * head - uy * head / 2} ${-uy * head + ux * head / 2} l ${ux * head + uy * head / 2} ${uy * head - ux * head / 2} l ${-ux * head + uy * head / 2} ${-uy * head - ux * head / 2}`);
        label.setAttribute('x', cx + dx + (index === 2 ? -22 : 22)); label.setAttribute('y', cy + dy + (index === 0 ? 20 : -10));
        label.textContent = `${name} = ${format(length, 1)} N`;
      });
    }
    distance.set(state.displacement); acceleration.set(state.acceleration); critical.set(state.criticalAngle);
    const message = !state.resting && time >= travelDuration(params, gravity) ? words.cutoff : state.resting ? words.resting : words.sliding;
    api.feedback.textContent = message;
    api.setDescription(`${words.caption}. ${words.distance}: ${format(state.displacement)} m. ${message}`);
  }
  function setLanguage(next) {
    words = strings[next]; api.setLanguage(next);
    for (const spec of specs) controls.get(spec.key).localize(words[spec.key], spec.key === 'mass' ? translator(next)('kilograms') : spec.unit);
    hint.textContent = words.hint; coefficientNote.textContent = words.coefficientNote;
    distance.localize(words.distance, 'm'); acceleration.localize(words.acceleration, 'm/s²'); critical.localize(words.critical, '°');
    api.modelText.textContent = words.about; api.liveMark.textContent = words.caption; render(api.clock.time);
  }
  buildScene(); setLanguage(lang); api.clock.reset();
  return { reset, setLanguage, dispose: () => api.dispose() };
}
