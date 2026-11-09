import { createExperiment } from '../../core/experiment.js';
import { createBodyAnalysis } from '../../core/body-analysis.js';
import { createEnergyBar } from '../../core/energy-bar.js';
import { format } from '../../core/i18n.js';
import { parameter, metric } from '../../core/controls.js';
import { element, svgElement as s, svgText, setText } from '../../core/dom.js';
import { motionModel } from '../../core/motion-graphs.js';
import { geometryLayer, geometryLabel, dimensionGuide, angleGuide, showInitialGeometry } from '../../core/geometry.js';
import { prepareSketchOutlines } from '../../core/sketch.js';
import { physicsConfig } from '../../config.js';
import { defaults as modelDefaults, models, duration } from './physics.js';
import { wordsFor } from './strings.js';
import { renderLatex } from '../../core/latex.js';
import { circularAnalysis } from './analysis.js';

const specsFor = kind => [
  { key: 'mass', symbol: 'm', min: 1, max: 30, step: 0.5, unit: 'kg' },
  ...(kind === 'two-string' ? [
    { key: 'length', symbol: 'ℓ', min: 0.5, max: 3, step: 0.1, unit: 'm' },
    { key: 'separation', symbol: 'd', min: 0.1, max: 5.5, step: 0.1, unit: 'm' },
  ] : [{ key: 'radius', symbol: 'R', min: kind === 'rotating-tube' ? 0.01 : 0.2, max: 3, step: kind === 'rotating-tube' ? 0.01 : 0.1, unit: 'm' }]),
  ...(kind === 'rotating-tube' ? [{ key: 'friction', symbol: 'μ_s', min: 0, max: 1, step: 0.01, unit: '' }] : []),
  ...(kind === 'energy-bowl'
    ? [{ key: 'releaseAngle', symbol: 'θ_0', min: 10, max: 90, step: 1, unit: '°' }]
    : [{ key: 'frequency', symbol: 'f', min: 0.05, max: 5, step: 0.05, unit: 'Hz' }]),
];
export function mountCircularSystem(kind, { root, lang }) {
  const bowl = kind === 'energy-bowl', tube = kind === 'rotating-tube', gravity = physicsConfig.gravity;
  let params = { ...modelDefaults[kind] }, words = wordsFor(kind, lang), selected = false, paused = false, resolved = false, ready = false, geometrySignature = '';
  const model = models[kind], controls = new Map(), specs = specsFor(kind);
  const api = createExperiment({ root, lang, system: kind, render, reset, defaults: restore,
    duration: () => duration(kind, params, gravity),
    motion: () => motionModel(time => { const state = model(params, time, gravity); return [[state.position], [state.velocity], [state.acceleration]]; },
      { note: bowl ? 'graphBowlNote' : 'graphCircularNote' }),
  });
  api.svg.setAttribute('role', 'group');
  const hint = element('p', 'analysis-hint'); hint.id = `${kind}-hint`; api.stageColumn.append(hint);
  const energy = bowl ? createEnergyBar({ parent: api.stageColumn, words }) : null;
  if (energy) {
    const stage = api.svg.parentNode;
    const transport = [...stage.children].find(node => node.className === 'transport');
    stage.insertBefore(energy.root, transport);
  }
  const analysis = createBodyAnalysis({ parent: api.stageColumn, signal: api.signal, id: `${kind}-analysis`, onClose: close });
  for (const spec of specs) {
    const control = parameter({ ...spec, id: `${kind}-${spec.key}`, label: words[spec.key], value: params[spec.key], signal: api.signal,
      onChange(value) {
        params[spec.key] = value;
        if (kind === 'two-string' && params.separation >= 2 * params.length) {
          params.separation = Number((2 * params.length - 0.1).toFixed(1));
          controls.get('separation').update(params.separation);
        }
        reset();
      } });
    controls.set(spec.key, control); api.parameters.append(control.root);
  }
  let resolveCheckbox, resolveText, resolveNote;
  if (bowl) {
    const toggle = element('label', 'compare-toggle');
    resolveCheckbox = element('input'); resolveCheckbox.type = 'checkbox'; resolveCheckbox.id = 'energy-bowl-resolve-forces';
    resolveText = element('span'); toggle.append(resolveCheckbox, resolveText);
    resolveNote = element('p', 'panel-note'); resolveNote.hidden = true;
    api.parameters.append(toggle, resolveNote);
    resolveCheckbox.addEventListener('change', () => {
      resolved = resolveCheckbox.checked; resolveNote.hidden = !resolved; render(api.clock.time);
    }, { signal: api.signal });
  }
  const metricSpecs = bowl ? [['speed', 'm/s', 'v'], ['centripetal', 'm/s²', 'a_r'], ['tangential', 'm/s²', 'a_t'], ['normal', 'N', 'N']]
    : tube ? [['required', 'N', 'f_s'], ['limit', 'N', 'f_s,max'], ['maximumFrequency', 'Hz', 'f_max'], ['maximumRadius', 'm', 'r_max']]
      : [['radius', 'm', 'r'], ['speed', 'm/s', 'v'], ['upper', 'N', 'T_1'], ['lower', 'N', 'T_2']];
  const readings = metricSpecs.map(([key, unit, symbol]) => ({ key, unit, ...metric(words[key], unit, symbol) }));
  for (const reading of readings) api.metrics.append(reading.root);
  const viewLabels = [];
  const label = (x, y, key) => { const node = svgText(api.svg, x, y, '', { 'text-anchor': 'middle' }); viewLabels.push({ node, key }); };
  let support, upperString, lowerString, sideMass, topMass, body, orbitRadius, radialReference, sideTube, sideTubeInner;
  const bodies = [];
  function mass(x, y) {
    const group = s('g', { class: 'selectable-mass', role: 'button', tabindex: 0, transform: `translate(${x} ${y})`, 'aria-controls': `${kind}-analysis`, 'aria-describedby': hint.id }, api.svg);
    s('circle', { class: 'mass-hit', r: 32, fill: 'transparent', 'aria-hidden': 'true' }, group);
    s('circle', { class: 'mass-body', r: 16, fill: '#c38e60' }, group);
    svgText(group, 0, 5, 'm', { class: 'mass-text', 'text-anchor': 'middle' });
    group.addEventListener('click', select, { signal: api.signal });
    group.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); } }, { signal: api.signal });
    bodies.push(group); return group;
  }
  if (bowl) {
    s('path', { d: 'M 180 140 A 220 220 0 0 0 620 140', fill: 'none', stroke: '#61816b', 'stroke-width': 6 }, api.svg);
    s('path', { d: 'M 180 140 H 620 M 400 140 V 360', fill: 'none', stroke: '#9ca79c', 'stroke-dasharray': '5 5' }, api.svg);
    s('circle', { cx: 400, cy: 140, r: 4, fill: '#61816b' }, api.svg);
    svgText(api.svg, 387, 127, 'O');
    for (const [name, angle] of [['A', 90], ['B', 30], ['C', 0]]) {
      const theta = angle * Math.PI / 180, x = 400 + 220 * Math.sin(theta), y = 140 + 220 * Math.cos(theta);
      s('circle', { cx: x, cy: y, r: 4, fill: '#61816b' }, api.svg);
      svgText(api.svg, x + (name === 'C' ? -8 : 16), y + (name === 'C' ? 28 : 7), name);
    }
    upperString = s('path', { fill: 'none', stroke: '#9ca79c', 'stroke-dasharray': '4 5' }, api.svg);
    body = mass(620, 140);
  } else if (tube) {
    label(270, 45, 'top'); label(620, 85, 'side');
    s('circle', { cx: 270, cy: 250, r: 140, fill: 'none', stroke: '#9ca79c', 'stroke-dasharray': '5 5' }, api.svg);
    support = s('g', {}, api.svg);
    s('rect', { x: -12, y: -25, width: 195, height: 50, rx: 10, fill: '#e5e7d9', stroke: '#61816b', 'stroke-width': 2 }, support);
    s('path', { d: 'M 0 -19 H 178 M 0 19 H 178', fill: 'none', stroke: '#9ca79c', 'stroke-width': 1.5 }, support);
    s('path', { d: 'M 620 130 V 380', class: 'tube-side-axis', fill: 'none', stroke: '#9ca79c', 'stroke-width': 2, 'stroke-dasharray': '5 5' }, api.svg);
    sideTube = s('path', { class: 'tube-side-housing', fill: 'none', stroke: '#61816b', 'stroke-width': 48, 'stroke-linecap': 'round' }, api.svg);
    sideTubeInner = s('path', { fill: 'none', stroke: '#e5e7d9', 'stroke-width': 44, 'stroke-linecap': 'round' }, api.svg);
    body = mass(410, 250); sideMass = mass(720, 250);
    sideMass.setAttribute('data-view', 'side');
    s('circle', { cx: 270, cy: 250, r: 5, fill: '#476b60' }, api.svg);
    svgText(api.svg, 252, 236, 'O');
  } else {
    label(285, 40, 'side'); label(625, 80, 'top');
    s('path', { d: 'M 285 60 V 420', stroke: '#9ca79c', 'stroke-width': 3, 'stroke-dasharray': '5 5' }, api.svg);
    radialReference = s('path', { class: 'two-string-horizontal-reference', fill: 'none', stroke: '#9ca79c', 'stroke-width': 1.5, 'stroke-dasharray': '4 5' }, api.svg);
    upperString = s('path', { fill: 'none', stroke: '#ad8959', 'stroke-width': 3 }, api.svg);
    lowerString = s('path', { fill: 'none', stroke: '#ad8959', 'stroke-width': 3 }, api.svg);
    s('circle', { cx: 625, cy: 250, r: 95, fill: 'none', stroke: '#9ca79c', 'stroke-dasharray': '5 5' }, api.svg);
    orbitRadius = s('path', { fill: 'none', stroke: '#ad8959', 'stroke-width': 2 }, api.svg);
    s('circle', { cx: 625, cy: 250, r: 4, fill: '#476b60' }, api.svg);
    body = mass(450, 240); topMass = mass(720, 250);
  }
  const warning = svgText(api.svg, 400, 455, '', { class: 'circular-status', 'text-anchor': 'middle' });
  let tubeWarning;
  if (tube) {
    const box = s('foreignObject', { x: 100, y: 424, width: 600, height: 64, 'pointer-events': 'none' }, api.svg);
    tubeWarning = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
    tubeWarning.style.textAlign = 'center';
    tubeWarning.append(renderLatex(String.raw`f > f_{\mathrm{max}} = \frac{1}{2\pi}\sqrt{\frac{\mu_s g}{r}}`));
    box.append(tubeWarning);
  }
  const forceLayer = s('g', { 'pointer-events': 'none', 'aria-hidden': 'true' }, api.svg);
  const forceAxes = bowl ? s('g', { class: 'bowl-force-axes' }, forceLayer) : null;
  const axisPaths = bowl ? [0, 1].map(() => s('path', { fill: 'none', stroke: '#839775', 'stroke-width': 1.3, 'stroke-dasharray': '4 5' }, forceAxes)) : [];
  const axisLabels = bowl ? ['+r', '+t'].map(text => svgText(forceAxes, 0, 0, text)) : [];
  const arrows = Array.from({ length: 5 }, (_, index) => ({
    path: s('path', { fill: 'none', stroke: index === 1 ? '#9a451b' : '#174d77', 'stroke-width': 3 }, forceLayer),
    label: svgText(forceLayer, 0, 0, '', { class: 'force-label', 'text-anchor': 'middle' }),
  }));
  const geometry = geometryLayer(api.svg);
  function arrow(index, x, y, dx, dy, text, labelX = x + dx + 16, labelY = y + dy - 8) {
    const length = Math.hypot(dx, dy), ux = length ? dx / length : 0, uy = length ? dy / length : 0, head = Math.min(9, length / 2);
    arrows[index].path.setAttribute('display', 'inline'); arrows[index].label.setAttribute('display', 'inline');
    arrows[index].path.setAttribute('d', length < 0.01 ? '' : `M ${x} ${y} l ${dx} ${dy} m ${-head * ux + head / 2 * uy} ${-head * uy - head / 2 * ux} l ${head * ux - head / 2 * uy} ${head * uy + head / 2 * ux} l ${-head * ux - head / 2 * uy} ${-head * uy + head / 2 * ux}`);
    arrows[index].label.setAttribute('x', labelX); arrows[index].label.setAttribute('y', labelY); setText(arrows[index].label, text);
  }
  function reset() { paused = false; api.clock.reset(); }
  function restore() { if (bowl) { resolved = false; resolveCheckbox.checked = false; resolveNote.hidden = true; } params = { ...modelDefaults[kind] }; for (const [key, control] of controls) control.update(params[key]); reset(); }
  function close() { selected = false; paused = false; analysis.hide(); render(api.clock.time); body.focus({ preventScroll: true }); }
  function select() { paused = api.clock.playing; if (paused) api.clock.pause(); selected = true; render(api.clock.time); }
  root.addEventListener('keydown', event => { if (event.key === 'Escape' && selected && !event.defaultPrevented) { event.preventDefault(); close(); } }, { signal: api.signal });
  function render(time, { updateReadouts = true } = {}) {
    if (!ready) return;
    const state = model(params, time, gravity), c = Math.cos(state.phase || 0), sn = Math.sin(state.phase || 0);
    let x, y, sideScale;
    for (const item of arrows) { item.path.setAttribute('display', 'none'); item.label.setAttribute('display', 'none'); }
    forceLayer.setAttribute('display', selected || resolved ? 'inline' : 'none');
    if (bowl) {
      x = 400 + 220 * Math.sin(state.theta); y = 140 + 220 * Math.cos(state.theta);
      upperString.setAttribute('d', `M 400 140 L ${x} ${y}`);
      const scale = 85 / Math.max(state.normal, state.weight);
      const sine = Math.sin(state.theta), cosine = Math.cos(state.theta);
      arrow(0, x, y, -state.normal * scale * sine, -state.normal * scale * cosine, 'N');
      forceAxes.setAttribute('display', resolved ? 'inline' : 'none');
      if (resolved) {
        // +r points inward; +t increases θ. The two weight components sum to (0, mg).
        const tangential = -state.weight * sine, radial = -state.weight * cosine;
        arrow(1, x, y, tangential * scale * cosine, -tangential * scale * sine,
          `−mg sin θ = ${format(tangential, 1)} N`, x + tangential * scale * cosine - 42, y - tangential * scale * sine + 26);
        arrow(2, x, y, -radial * scale * sine, -radial * scale * cosine,
          `−mg cos θ = ${format(radial, 1)} N`, x - radial * scale * sine + 62, y - radial * scale * cosine + 18);
        [[-sine, -cosine], [cosine, -sine]].forEach(([ux, uy], index) => {
          axisPaths[index].setAttribute('d', `M ${x - 65 * ux} ${y - 65 * uy} L ${x + 90 * ux} ${y + 90 * uy}`);
          axisLabels[index].setAttribute('x', x + 101 * ux + 8);
          axisLabels[index].setAttribute('y', y + 101 * uy + 5);
        });
      } else arrow(1, x, y, 0, state.weight * scale, 'mg', x - 28, y + state.weight * scale + 16);
    } else if (tube) {
      const radialScale = state.radius / params.radius;
      x = 270 + 140 * radialScale * c; y = 250 + 140 * radialScale * sn;
      support.setAttribute('transform', `translate(270 250) rotate(${state.phase * 180 / Math.PI})`);
      const sideX = 620 + 100 * radialScale * c;
      const sidePath = `M ${620 - 12 / 140 * 100 * c} 250 H ${620 + 183 / 140 * 100 * c}`;
      sideTube.setAttribute('d', sidePath); sideTubeInner.setAttribute('d', sidePath);
      sideMass.setAttribute('transform', `translate(${sideX} 250)`);
      arrow(0, sideX, 250, 0, -80, 'N', sideX + 32, 164);
      arrow(1, sideX, 250, 0, 80, 'mg', sideX + 32, 340);
      {
        const frictionLabel = state.valid ? 'fₛ' : 'fₖ';
        const length = state.limit > 0 ? 80 * state.frictionForce / state.limit : 0;
        arrow(2, sideX, 250, -length * c, 0, Math.abs(c) < 0.08 ? `${frictionLabel} ${sn > 0 ? '⊗' : '⊙'}` : frictionLabel, sideX - length * c / 2, 215);
        arrow(3, x, y, -length * c, -length * sn, frictionLabel);
        if (!state.valid && state.wallForce > 0) {
          const wallLength = 80 * state.wallForce / Math.max(state.wallForce, state.limit);
          arrow(4, x, y, -wallLength * sn, wallLength * c, 'N_wall');
        }
      }
    } else {
      sideScale = Math.min(165 / state.radius, 150 / (params.separation / 2));
      const half = params.separation * sideScale / 2, rp = state.radius * sideScale;
      x = 285 + rp * c; y = 240;
      radialReference.setAttribute('d', `M 285 240 H ${x} M 285 228 h ${x >= 285 ? 12 : -12} v 12`);
      upperString.setAttribute('d', `M 285 ${240 - half} L ${x} ${y}`);
      lowerString.setAttribute('d', `M 285 ${240 + half} L ${x} ${y}`);
      lowerString.setAttribute('stroke-dasharray', state.valid ? '' : '4 6');
      topMass.setAttribute('transform', `translate(${625 + 95 * c} ${250 + 95 * sn})`);
      orbitRadius.setAttribute('d', `M 625 250 L ${625 + 95 * c} ${250 + 95 * sn}`);
      if (state.valid) {
        const scale = 95 / Math.max(state.upper, state.weight);
        arrow(0, x, y, -state.upper * scale * Math.cos(state.alpha) * c, -state.upper * scale * Math.sin(state.alpha), 'T₁');
        arrow(2, x, y, -Math.max(0, state.lower) * scale * Math.cos(state.alpha) * c, Math.max(0, state.lower) * scale * Math.sin(state.alpha), 'T₂');
        arrow(1, x, y, 0, state.weight * scale, 'mg', x + 30, y + state.weight * scale + 18);
      }
    }
    body.setAttribute('transform', `translate(${x} ${y})`);
    for (const item of bodies) { item.setAttribute('aria-label', words.block); item.setAttribute('aria-pressed', String(selected)); }
    showInitialGeometry(geometry, time, api.clock.playing);
    if (time === 0 && !api.clock.playing) {
      const signature = JSON.stringify(params);
      if (signature !== geometrySignature) {
        geometrySignature = signature; geometry.replaceChildren();
        if (bowl) {
          const angle = params.releaseAngle * Math.PI / 180;
          angleGuide(geometry, 400, 140, 65, Math.PI / 2 - angle, Math.PI / 2, `θ₀ = ${params.releaseAngle}°`, 475, 195);
          geometryLabel(geometry, (400 + x) / 2 + 25, (140 + y) / 2 - 10, `R = ${params.radius.toFixed(1)} m`);
          geometryLabel(geometry, 555, 410, 'B: θ = 30°');
        } else if (tube) {
          dimensionGuide(geometry, 270, 305, 410, 305, `r = ${params.radius.toFixed(2)} m`);
          dimensionGuide(geometry, 620, 310, 720, 310, `r = ${params.radius.toFixed(2)} m`);
        } else {
          const half = params.separation * sideScale / 2;
          dimensionGuide(geometry, 120, 240 - half, 120, 240 + half, `d = ${params.separation.toFixed(1)} m`, 77, 245);
          dimensionGuide(geometry, 285, 295, x, 295, `r = ${state.radius.toFixed(3)} m`);
          geometryLabel(geometry, (285 + x) / 2 + 40, 220 - half / 2, `ℓ = ${params.length.toFixed(1)} m`);
          angleGuide(geometry, x, 240, 46, Math.PI, Math.PI + state.alpha, `α = ${(state.alpha * 180 / Math.PI).toFixed(1)}°`, x - 85, 215);
        }
      }
    }
    energy?.update(state, { updateReadouts });
    if (api.clock.playing) paused = false;
    if (!updateReadouts) return;
    for (const reading of readings) reading.set(state[reading.key]);
    const ended = time >= duration(kind, params, gravity);
    const message = tube && !state.valid && ended ? words.slidingEnd : !state.valid ? words.invalid : ended ? bowl ? words.bowlEnd : words.circularEnd : words.moving;
    setText(api.feedback, message);
    setText(warning, !state.valid && !tube ? 'T₂ < 0' : '');
    if (tubeWarning) tubeWarning.parentNode.setAttribute('display', state.valid ? 'none' : 'inline');
    api.setDescription(`${words.caption}. ${message} ${words.speed}: ${state.speed.toFixed(2)} m/s.`);
    if (selected) analysis.update(circularAnalysis(kind, words, state, paused, ended));
  }
  function setLanguage(next) {
    words = wordsFor(kind, next); api.setLanguage(next);
    for (const spec of specs) controls.get(spec.key).localize(words[spec.key], spec.unit);
    for (const reading of readings) reading.localize(words[reading.key], reading.unit);
    for (const item of viewLabels) setText(item.node, words[item.key]);
    hint.textContent = words.hint; api.modelText.textContent = words.about; api.liveMark.textContent = words.caption;
    if (bowl) { resolveText.textContent = words.resolveForces; resolveNote.textContent = words.resolveNote; }
    energy?.setLanguage(words); render(api.clock.time);
  }
  prepareSketchOutlines(api.svg); ready = true; setLanguage(lang); api.clock.reset();
  return { reset, setLanguage, dispose: () => api.dispose() };
}
