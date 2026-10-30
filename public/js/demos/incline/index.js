import { prepareSketchOutlines } from '../../core/sketch.js';
import { geometryLayer, geometryLabel, angleGuide, dimensionGuide, showInitialGeometry } from '../../core/geometry.js';
import { motionModel } from '../../core/motion-graphs.js';
import { physicsConfig } from '../../config.js';
import { createExperiment } from '../../core/experiment.js';
import { createBodyAnalysis } from '../../core/body-analysis.js';
import { parameter, metric } from '../../core/controls.js';
import { element, setText, svgElement as s, svgText } from '../../core/dom.js';
import { translator, format } from '../../core/i18n.js';
import { defaultParameters, inclineState, travelDuration } from './physics.js';
import { strings } from './strings.js';
import { bodyAnalysis } from './analysis.js';
export function mount({ root, lang }) {
  let params = { ...defaultParameters }, words = strings[lang], selected = false, paused = false, resolved = false, scene;
  const gravity = physicsConfig.gravity, controls = new Map();
  const api = createExperiment({ root, lang, system: 'incline', motion: () => motionModel(time => { const state = inclineState(params, time, gravity); return [[state.displacement], [state.velocity], [state.acceleration]]; }, { note: 'graphInclineNote' }), duration: () => travelDuration(params, gravity), render, reset, defaults });
  api.svg.setAttribute('role', 'group');
  const hint = element('p', 'analysis-hint'); hint.id = 'incline-hint'; api.stageColumn.append(hint);
  const analysis = createBodyAnalysis({ parent: api.stageColumn, signal: api.signal, id: 'incline-analysis', onClose: close });
  const distance = metric(words.distance, 'm', 's'), acceleration = metric(words.acceleration, 'm/s²', 'a'), critical = metric(words.critical, '°', 'θ_c');
  api.metrics.append(distance.root, acceleration.root, critical.root);
  const specs = [
    { key: 'mass', symbol: 'm', min: 1, max: 30, step: 0.5, unit: 'kg' },
    { key: 'angle', symbol: 'θ', min: 0, max: 60, step: 0.1, unit: '°' },
    { key: 'staticFriction', symbol: 'μ_s', min: 0, max: 1, step: 0.01, unit: '' },
    { key: 'kineticFriction', symbol: 'μ_k', min: 0, max: 1, step: 0.01, unit: '' },
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
  const resolveToggle = element('label', 'compare-toggle');
  const resolveCheckbox = element('input'); resolveCheckbox.type = 'checkbox'; resolveCheckbox.id = 'incline-resolve-forces';
  const resolveText = element('span'); resolveToggle.append(resolveCheckbox, resolveText);
  const resolveNote = element('p', 'panel-note'); resolveNote.hidden = true;
  api.parameters.append(resolveToggle, resolveNote);
  resolveCheckbox.addEventListener('change', () => {
    resolved = resolveCheckbox.checked; resolveNote.hidden = !resolved; render(api.clock.time);
  }, { signal: api.signal });
  function reset() { paused = false; api.clock.reset(); }
  function defaults() {
    resolved = false; resolveCheckbox.checked = false; resolveNote.hidden = true;
    params = { ...defaultParameters }; for (const [key, control] of controls) control.update(params[key]); buildScene(); reset();
  }
  function close() { selected = false; paused = false; analysis.hide(); render(api.clock.time); scene.block.focus({ preventScroll: true }); }
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
    const geometry = geometryLayer(api.svg);
    if (alpha > 0) angleGuide(geometry, startX, startY, 65, 0, alpha,
      `θ = ${format(params.angle, 1)}°`, startX + 115, startY + 24);
    else geometryLabel(geometry, startX + 115, startY + 24, 'θ = 0°');
    // The interior angle at the foot is the angle between the slope and ground.
    const slopeAngle = s('g', { class: 'incline-angle', 'pointer-events': 'none', direction: 'ltr' }, api.svg);
    if (alpha > 0) angleGuide(slopeAngle, endX, endY, 55, Math.PI, Math.PI + alpha,
      `θ = ${format(params.angle, 1)}°`, endX - 95, endY - 14);
    else geometryLabel(slopeAngle, endX - 70, endY + 28, 'θ = 0°');
    const block = s('g', { class: 'selectable-mass', role: 'button', tabindex: 0, 'aria-controls': 'incline-analysis', 'aria-describedby': hint.id }, api.svg);
    s('circle', { class: 'mass-hit', cy: -24, r: 64, fill: 'transparent', 'aria-hidden': 'true' }, block);
    s('rect', { class: 'mass-body', x: -24, y: -48, width: 48, height: 48, rx: 5, fill: '#61816b' }, block);
    svgText(block, 0, -18, 'm', { class: 'mass-text', 'text-anchor': 'middle' });
    const forces = s('g', { 'pointer-events': 'none', 'aria-hidden': 'true' }, api.svg);
    const axes = s('g', { class: 'incline-force-axes' }, forces);
    const axisPaths = [s('path', {}, axes), s('path', {}, axes)];
    const axisLabels = [svgText(axes, 0, 0, '+x'), svgText(axes, 0, 0, '+y')];
    const arrows = ['#9a451b', '#174d77', '#7a4e86', '#bd7126'].map(color => {
      const path = s('path', { stroke: color, fill: 'none', 'stroke-width': 4 }, forces);
      const label = svgText(forces, 0, 0, '', { 'text-anchor': 'middle', class: 'force-label incline-force-label' });
      return { path, label };
    });
    prepareSketchOutlines(api.svg);
    scene = { c, sn, scale, startX, startY, block, forces, arrows, geometry, axes, axisPaths, axisLabels };
  }
  function render(time, { updateReadouts = true } = {}) {
    if (!scene) return;
    showInitialGeometry(scene.geometry, time, api.clock.playing);
    const state = inclineState(params, time, gravity), { c, sn, scale, startX, startY } = scene;
    const x = startX + (0.5 + state.displacement) * scale * c, y = startY + (0.5 + state.displacement) * scale * sn;
    scene.block.setAttribute('transform', `translate(${x} ${y}) rotate(${params.angle})`);
    scene.block.setAttribute('aria-label', words.block); scene.block.setAttribute('aria-pressed', String(selected));
    scene.forces.setAttribute('display', selected || resolved ? 'inline' : 'none');
    if (api.clock.playing) paused = false;
    if (selected && updateReadouts) analysis.update(bodyAnalysis(words, state, paused, time >= travelDuration(params, gravity)));
    if (selected || resolved) {
      // All force arrows share the same scale, set by weight to fit the scene.
      const forceScale = 60 / state.weight, cx = x + 24 * sn, cy = y - 24 * c;
      scene.axes.setAttribute('display', resolved ? 'inline' : 'none');
      [[c, sn], [sn, -c]].forEach(([ux, uy], index) => {
        scene.axisPaths[index].setAttribute('d', `M ${cx - 75 * ux} ${cy - 75 * uy} L ${cx + 75 * ux} ${cy + 75 * uy}`);
        scene.axisLabels[index].setAttribute('x', cx + 80 * ux + 8);
        scene.axisLabels[index].setAttribute('y', cy + 70 * uy + 6);
      });
      const vectors = [[0, state.weight, 'mg'], [state.normal * sn, -state.normal * c, 'N'], [-state.friction * c, -state.friction * sn, state.resting ? 'fₛ' : 'fₖ']];
      if (resolved) {
        vectors[0] = [state.downhill * c, state.downhill * sn, 'mg sin θ'];
        vectors.push([-state.normal * sn, state.normal * c, 'mg cos θ']);
      }
      scene.arrows.forEach(({ path, label }, index) => {
        const visible = index < vectors.length;
        path.setAttribute('display', visible ? 'inline' : 'none');
        label.setAttribute('display', visible ? 'inline' : 'none');
      });
      vectors.forEach(([fx, fy, name], index) => {
        const { path, label } = scene.arrows[index], length = Math.hypot(fx, fy), dx = fx * forceScale, dy = fy * forceScale;
        const ux = length ? fx / length : 0, uy = length ? fy / length : 0, head = Math.min(10, length * forceScale / 2);
        path.setAttribute('d', `M ${cx} ${cy} l ${dx} ${dy} m ${-ux * head - uy * head / 2} ${-uy * head + ux * head / 2} l ${ux * head + uy * head / 2} ${uy * head - ux * head / 2} l ${-ux * head + uy * head / 2} ${-uy * head - ux * head / 2}`);
        label.setAttribute('x', cx + dx + (index === 2 ? -35 : index === 3 ? -28 : 28)); label.setAttribute('y', cy + dy + (index === 0 || index === 3 ? 22 : -10));
        label.textContent = `${name} = ${format(length, 1)} N`;
      });
    }
    if (updateReadouts) {
      distance.set(state.displacement); acceleration.set(state.acceleration); critical.set(state.criticalAngle);
      const message = !state.resting && time >= travelDuration(params, gravity) ? words.cutoff : state.resting ? words.resting : words.sliding;
      setText(api.feedback, message);
      api.setDescription(`${words.caption}. ${words.distance}: ${format(state.displacement)} m. ${message}`);
    }
  }
  function setLanguage(next) {
    words = strings[next]; api.setLanguage(next);
    for (const spec of specs) controls.get(spec.key).localize(words[spec.key], spec.key === 'mass' ? translator(next)('kilograms') : spec.unit);
    hint.textContent = words.hint; coefficientNote.textContent = words.coefficientNote;
    resolveText.textContent = words.resolveForces; resolveNote.textContent = words.resolveNote;
    distance.localize(words.distance, 'm'); acceleration.localize(words.acceleration, 'm/s²'); critical.localize(words.critical, '°');
    api.modelText.textContent = words.about; api.liveMark.textContent = words.caption; render(api.clock.time);
  }
  buildScene(); setLanguage(lang); api.clock.reset();
  return { reset, setLanguage, dispose: () => api.dispose() };
}
