import { physicsConfig } from '../../config.js';
import { createExperiment } from '../../core/experiment.js';
import { parameter, metric } from '../../core/controls.js';
import { element, button, svgElement as s, setText } from '../../core/dom.js';
import { format } from '../../core/i18n.js';
import { prepareSketchOutlines } from '../../core/sketch.js';
import { motionModel } from '../../core/motion-graphs.js';
import { defaults, sample, endTime } from './physics.js';
import { createBodyAnalysis } from '../../core/body-analysis.js';
import { renderLatex, mathText } from '../../core/latex.js';
import { sceneGeometry, roughSurfacePath } from './geometry.js';
import { bodyForces } from './forces.js';
import { bodyAnalysis, solutionSteps, accelerationCalculation } from './analysis.js';
import { strings } from './strings.js';

export function mountSystem(kind, { root, lang }) {
  let params = { ...defaults[kind] }, words = strings[lang], selected = null, paused = false;
  const g = physicsConfig.gravity, controls = new Map();
  const system = `friction-${kind}`;
  const api = createExperiment({ root, lang, system, viewBox: '0 0 640 450', mobileViewBox: '0 -90 640 540',
    duration: () => endTime(kind, params, g), render, reset, defaults: restore,
    motion: () => motionModel(time => {
      const state = sample(kind, params, time, g);
      return kind === 'stacked'
        ? [[state.topPosition, state.bottomPosition], [state.topVelocity, state.bottomVelocity], [state.topAcceleration, state.bottomAcceleration]]
        : [[state.position], [state.velocity], [state.acceleration]];
    }, kind === 'stacked' ? { components: ['graphUpperBlock', 'graphLowerBlock'], note: 'graphStackedNote' } : {}),
  });
  const problem = element('section', 'friction-problem');
  const problemHeading = element('h2'), problemText = element('p'); problem.append(problemHeading, problemText);
  api.stageColumn.insertBefore(problem, api.stageColumn.children[0]);
  const solution = element('details', 'model-notes friction-solution');
  const summary = element('summary'), steps = element('ol');
  const calculation = element('details', 'analysis-expansion friction-calculation');
  const calculationTitle = element('summary'), calculationContent = element('div');
  calculation.append(calculationTitle, calculationContent); solution.append(summary, steps, calculation); api.stageColumn.append(solution);
  let calculationSignature = '';
  function updateCalculation() {
    const items = accelerationCalculation(kind, params, g, words), signature = JSON.stringify(items);
    if (signature === calculationSignature) return;
    calculationSignature = signature;
    calculationContent.replaceChildren(...items.map(item => {
      const node = element(item.math ? 'div' : 'p', item.math ? 'equation' : '');
      if (item.math) node.append(renderLatex(item.text, 'block')); else node.textContent = item.text;
      return node;
    }));
  }
  const hint = element('p', 'analysis-hint'); hint.id = `${system}-hint`; api.stageColumn.append(hint);
  const analysis = createBodyAnalysis({ parent: api.stageColumn, signal: api.signal, id: `${system}-analysis`, onClose: close });
  api.svg.setAttribute('role', 'group');
  const slipPlayback = kind === 'stacked' ? button(words.slowSlip, 'button secondary slip-playback') : null;
  if (slipPlayback) {
    api.stageColumn.insertBefore(slipPlayback, solution);
    slipPlayback.addEventListener('click', () => { reset(); api.setPlaybackRate(0.25); api.clock.play(); }, { signal: api.signal });
  }
  const bonus = element('details', 'model-notes friction-bonus');
  const bonusTitle = element('summary', '', words.bonus), bonusParameters = element('div', 'parameters');
  bonus.append(bonusTitle, bonusParameters);
  const releaseNote = element('p', 'panel-note', words.releaseNote);
  const specs = kind === 'stacked' ? [
    { key: 'mass', symbol: 'm', min: 1, max: 15, step: 0.5, unit: 'kg' },
    { key: 'mu', symbol: kind === 'stacked' ? 'μ' : 'μ_k', min: 0, max: 0.6, step: 0.01, unit: '' },
    { key: 'muBetween', symbol: 'μ_k,t', min: 0, max: 1.8, step: 0.01, unit: '' },
    { key: 'force', symbol: 'F', min: 0, max: 200, step: 1, unit: 'N' },
    { key: 'speed', symbol: 'v_0', min: 0, max: 3, step: 0.1, unit: 'm/s' },
  ] : [
    { key: 'mass1', symbol: 'm_1', min: 1, max: 15, step: 0.5, unit: 'kg' },
    { key: 'mass2', symbol: 'm_2', min: 1, max: 15, step: 0.5, unit: 'kg' },
    { key: 'angle', symbol: 'α', min: 10, max: 60, step: 1, unit: '°' },
    { key: 'mu', symbol: kind === 'stacked' ? 'μ' : 'μ_k', min: 0, max: 0.6, step: 0.01, unit: '' },
    { key: 'speed', symbol: 'v_0', min: 0, max: 3, step: 0.1, unit: 'm/s' },
  ];
  for (const spec of specs) {
    const control = parameter({ ...spec, id: `${system}-${spec.key}`, label: words[spec.key], value: params[spec.key], signal: api.signal,
      onChange(value) {
        params[spec.key] = value;
        if (kind === 'stacked') {
          params.muBetween = Math.min(params.muBetween, 3 * params.mu);
          controls.get('muBetween')?.update(params.muBetween);
        }
        reset();
      } });
    controls.set(spec.key, control); (spec.key === 'speed' ? bonusParameters : api.parameters).append(control.root);
  }
  const slidingNote = kind === 'stacked' ? element('p', 'panel-note') : null;
  if (slidingNote) api.parameters.append(slidingNote);
  let directionLabel, direction, down, up, directionWrap;
  if (kind === 'hanging') {
    const wrap = element('label', 'playback'); directionWrap = wrap; directionLabel = element('span'); direction = element('select');
    down = element('option'); down.value = '1'; up = element('option'); up.value = '-1'; direction.append(down, up);
    wrap.append(directionLabel, direction); bonusParameters.append(wrap);
    direction.addEventListener('change', () => { params.direction = Number(direction.value); reset(); }, { signal: api.signal });
  }
  api.parameters.append(releaseNote, bonus);
  const readings = [metric(words[kind === 'stacked' ? 'bottomAcceleration' : 'acceleration'], 'm/s²', kind === 'stacked' ? 'a_b' : 'a'), metric(words[kind === 'stacked' ? 'threshold' : 'tension'], 'N', kind === 'stacked' ? 'F_crit' : 'T')];
  readings.forEach(reading => api.metrics.append(reading.root));
  const topAcceleration = kind === 'stacked' ? metric(words.topAcceleration, 'm/s²', 'a_t') : null;
  const relativeSlip = kind === 'stacked' ? metric(words.relativeDisplacement, 'm', 'Δx') : null;
  if (topAcceleration) api.metrics.append(topAcceleration.root, relativeSlip.root);
  // Mathematical labels use the same local LaTeX renderer as the equations.
  function canvasMath(parent, className, width = 140, height = 38) {
    const box = s('foreignObject', { width, height, class: className, 'pointer-events': 'none' }, parent);
    const content = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
    content.setAttribute('class', 'friction-canvas-math'); box.append(content);
    let previous;
    return { box, update(source, x, y) {
      box.setAttribute('x', x - width / 2); box.setAttribute('y', y - height / 2);
      if (source !== previous) { content.replaceChildren(renderLatex(source)); previous = source; }
    } };
  }
  const scene = s('g', { class: 'friction-scene' }, api.svg);
  const ground = s('path', { class: 'friction-ground', fill: '#e5e7d9', stroke: '#61816b', 'stroke-width': 3, 'stroke-linejoin': 'round' }, scene);
  const support = s('path', { fill: 'none', stroke: '#9ca79c', 'stroke-width': 3, 'stroke-linecap': 'round' }, scene);
  const wheel = s('g', { class: 'friction-wheel' }, scene);
  const pulley = s('circle', { r: 16, fill: '#e8d3b6', stroke: '#775c45', 'stroke-width': 2 }, wheel);
  const rim = s('circle', { r: 12, fill: 'none', stroke: '#b59a79', 'stroke-width': 1.5 }, wheel);
  const axle = s('circle', { r: 3.5, fill: '#775c45' }, wheel);
  // Draw the rope over the rim, with one exact circular arc between tangencies.
  const rope = s('path', { class: 'friction-rope', fill: 'none', stroke: '#775c45', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, scene);
  const bodies = [0, 1].map((_, index) => {
    const group = s('g', { class: 'selectable-mass', role: 'button', tabindex: 0, 'data-body': index,
      'aria-controls': `${system}-analysis`, 'aria-describedby': hint.id }, scene);
    s('rect', { class: 'mass-body', x: -32, y: -25, width: 64, height: 50, rx: 5, fill: index ? '#d3a374' : '#a9bca0', stroke: '#3c5e49', 'stroke-width': 2 }, group);
    const label = canvasMath(group, 'friction-body-label', 60, 40);
    label.update(kind === 'stacked' ? 'm' : `m_${index + 1}`, 0, 0);
    group.addEventListener('click', () => select(index), { signal: api.signal });
    group.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(index); }
    }, { signal: api.signal });
    return group;
  });
  const roughness = s('path', { class: 'friction-surface-hatching', fill: 'none', stroke: '#61816b', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'pointer-events': 'none' }, scene);
  const applied = s('path', { fill: 'none', stroke: '#b77820', 'stroke-width': 3 }, scene);
  const appliedLabel = canvasMath(scene, 'friction-applied-label', 110);
  const angleArc = s('path', { class: 'friction-angle', fill: 'none', stroke: '#9a642e', 'stroke-width': 2 }, scene);
  const angleLabel = canvasMath(scene, 'friction-angle-label', 110);
  const coefficientLabel = canvasMath(scene, 'friction-coefficient-label', 200);
  const slidingCoefficient = canvasMath(scene, 'friction-coefficient-label', 200);
  const floorCoefficient = canvasMath(scene, 'friction-coefficient-label', 160);
  slidingCoefficient.box.setAttribute('display', kind === 'stacked' ? 'inline' : 'none');
  floorCoefficient.box.setAttribute('display', kind === 'stacked' ? 'inline' : 'none');
  const slipMark = s('path', { class: 'friction-slip-marker', fill: 'none', stroke: '#994e94', 'stroke-width': 2, display: 'none' }, scene);
  const slipLabel = canvasMath(scene, 'friction-slip-label', 200);
  const detached = s('g', { class: 'friction-detached-context', 'pointer-events': 'none', 'aria-hidden': 'true', display: 'none' }, api.svg);
  const connector = s('path', { fill: 'none', stroke: '#839775', 'stroke-width': 1.5, 'stroke-dasharray': '4 5' }, detached);
  const diagramBody = s('g', {}, detached);
  s('rect', { x: -26, y: -20, width: 52, height: 40, rx: 4, fill: '#d3a374', 'fill-opacity': 0.35, stroke: '#775c45', 'stroke-width': 1.5 }, diagramBody);
  const overlay = s('g', { class: 'canvas-forces friction-forces', 'pointer-events': 'none', 'aria-hidden': 'true', display: 'none' }, api.svg);
  const arrows = Array.from({ length: 6 }, () => {
    const group = s('g', {}, overlay);
    const path = s('path', { fill: 'none', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, group);
    return { group, path, label: canvasMath(group, 'friction-force-label', 64, 30) };
  });
  prepareSketchOutlines(api.svg);
  function select(index) {
    paused = api.clock.playing;
    if (paused) api.clock.pause();
    selected = index; render(api.clock.time);
  }
  function close() {
    const previous = selected; selected = null; paused = false; analysis.hide(); render(api.clock.time);
    if (previous !== null) bodies[previous].focus({ preventScroll: true });
  }
  function isBody(target) {
    for (; target && target !== api.svg; target = target.parentNode) if (bodies.includes(target)) return true;
    return false;
  }
  api.svg.addEventListener('click', event => { if (!isBody(event.target) && selected !== null) close(); }, { signal: api.signal });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && selected !== null && !event.defaultPrevented) { event.preventDefault(); close(); }
  }, { signal: api.signal });
  function reset() { paused = false; api.clock.reset(); }
  function restore() {
    params = { ...defaults[kind] };
    for (const [key, control] of controls) control.update(params[key]);
    if (direction) direction.value = String(params.direction);
    reset();
  }
  function render(time, { updateReadouts = true } = {}) {
    const state = sample(kind, params, time, g), geometry = sceneGeometry(kind, params, state.position, state.topPosition);
    ground.setAttribute('d', geometry.ground);
    roughness.setAttribute('d', roughSurfacePath(kind, geometry));
    if (slipPlayback) slipPlayback.hidden = !state.slipping;
    if (directionWrap) directionWrap.hidden = params.speed === 0;
    geometry.bodies.forEach((body, index) => {
      bodies[index].setAttribute('transform', `translate(${body.x} ${body.y}) rotate(${body.angle})`);
      bodies[index].setAttribute('aria-pressed', String(selected === index));
      bodies[index].setAttribute('aria-label', words[kind === 'stacked' ? index === 0 ? 'topBody' : 'bottomBody' : index === 0 ? 'body1' : 'body2']);
    });
    slipMark.setAttribute('display', kind === 'stacked' && state.relativeDisplacement > 1e-8 ? 'inline' : 'none');
    slipLabel.box.setAttribute('display', kind === 'stacked' && state.relativeDisplacement > 1e-8 ? 'inline' : 'none');
    if (kind === 'stacked') {
      const topX = geometry.bodies[0].x, bottomX = geometry.bodies[1].x;
      slipMark.setAttribute('d', `M ${topX} 191 V 201 M ${topX} 196 H ${bottomX} M ${bottomX} 191 V 201`);
      slipLabel.update(`x_b-x_t=${format(state.relativeDisplacement)}\\,\\mathrm{m}`, (topX + bottomX) / 2, 174);
      wheel.setAttribute('display', 'none'); support.setAttribute('d', ''); rope.setAttribute('d', ''); angleArc.setAttribute('d', '');
      angleLabel.box.setAttribute('display', 'none');
      const x = geometry.bodies[1].x;
      applied.setAttribute('d', selected === 1 ? '' : `M ${x - 130} 285 H ${x - 45} l -9 -5 m 9 5 l -9 5`);
      appliedLabel.box.setAttribute('display', selected === 1 ? 'none' : 'inline');
      appliedLabel.update(`F=${format(params.force, 0)}\\,\\mathrm{N}`, x - 90, 261);
      coefficientLabel.update(`\\mu_s=3\\mu=${format(3 * params.mu)}`, 110, 170);
      slidingCoefficient.update(`\\mu_{k,t}=${format(state.muBetween)}`, 110, 205);
      floorCoefficient.update(`\\mu=${format(params.mu)}`, 540, 340);
    } else {
      wheel.setAttribute('display', 'inline');
      wheel.setAttribute('transform', `translate(${geometry.wheel.x} ${geometry.wheel.y})`);
      support.setAttribute('d', `M 310 145 L ${geometry.wheel.x} ${geometry.wheel.y}`);
      rope.setAttribute('d', geometry.rope); applied.setAttribute('d', ''); appliedLabel.box.setAttribute('display', 'none');
      angleArc.setAttribute('d', geometry.angleArc); angleLabel.box.setAttribute('display', 'inline');
      angleLabel.update(`\\alpha=${params.angle}^{\\circ}`, geometry.angleLabel.x, geometry.angleLabel.y);
      coefficientLabel.update(`\\mu_k=${format(params.mu)}`, kind === 'table' ? 110 : 550, kind === 'table' ? 175 : geometry.foot.y + 30);
    }
    overlay.setAttribute('display', selected === null ? 'none' : 'inline');
    const besideBody = kind === 'stacked' && selected === 1;
    overlay.setAttribute('data-detached', String(besideBody));
    detached.setAttribute('display', besideBody ? 'inline' : 'none');
    if (selected !== null) {
      const allForces = bodyForces(kind, params, state, g), forces = allForces[selected];
      const scale = (besideBody ? 118 : 76) / Math.max(1, ...allForces.flat().map(force => Math.hypot(force.fx, force.fy)));
      const body = geometry.bodies[selected];
      // Keep the lower block's six forces in the open area beside the stack.
      // Clamp its horizontal motion so the longest arrow and label stay in view.
      const origin = besideBody ? { x: Math.min(body.x + 190, 440), y: 180 } : body;
      if (besideBody) {
        connector.setAttribute('d', `M ${body.x + 38} ${body.y} L ${origin.x - 76} ${origin.y + 30}`);
        diagramBody.setAttribute('transform', `translate(${origin.x} ${origin.y})`);
      }
      // The overlay only translates: weight remains vertical on a rotated block.
      overlay.setAttribute('transform', `translate(${origin.x} ${origin.y})`);
      arrows.forEach(({ group, path, label }, index) => {
        const force = forces[index]; group.setAttribute('display', force ? 'inline' : 'none');
        if (!force) return;
        group.setAttribute('data-force', force.id);
        group.style.setProperty('--force-color', force.color);
        const length = Math.hypot(force.fx, force.fy), dx = force.fx * scale, dy = force.fy * scale;
        const ux = length ? force.fx / length : 0, uy = length ? force.fy / length : 0, head = Math.min(besideBody ? 12 : 9, length * scale / 2);
        let ox = force.ox * (besideBody ? 2.4 : 1), oy = force.oy * (besideBody ? 2.8 : 1);
        if (besideBody) {
          if (force.id === 'weight') { ox = 0; oy = 0; }
          if (force.id === 'friction' || force.id === 'floor') {
            // Both friction arrows occupy the left side of the body. Preserve
            // the physical direction if static friction reverses during braking.
            ox = -32 - Math.max(dx, 0);
            oy = force.id === 'friction' ? -12 : 12;
          }
        }
        path.setAttribute('stroke-width', besideBody ? 5.5 : 4);
        path.setAttribute('stroke', force.color);
        path.setAttribute('d', length === 0 ? '' : `M ${ox} ${oy} l ${dx} ${dy} m ${-ux * head - uy * head / 2} ${-uy * head + ux * head / 2} l ${ux * head + uy * head / 2} ${uy * head - ux * head / 2} l ${-ux * head + uy * head / 2} ${-uy * head - ux * head / 2}`);
        let labelX = force.ox + dx + (Math.abs(ux) > 0.3 ? Math.sign(ux) * 28 : force.ox < 0 ? -48 : 48);
        let labelY = force.oy + dy + (force.id === 'friction' ? -22 : force.id === 'floor' ? 20 : uy < 0 ? -14 : 14);
        if (kind === 'stacked' && selected === 1 && force.id === 'weight') labelY += 20;
        if (Math.abs(uy) < 0.1) labelX = Math.sign(ux || 1) * Math.max(60, Math.abs(labelX));
        // Two parallel uphill forces need separate labels, especially when
        // kinetic friction is weak and its arrow ends inside the block.
        if (kind === 'hanging' && selected === 1 && force.id === 'friction') {
          labelX = Math.sign(force.fx || -params.direction) * 75;
          labelY = Math.sign(force.fy || -params.direction) * 24;
        }
        if (besideBody) {
          // Put each symbol beside its own shaft, including short friction
          // arrows. Separate parallel forces rather than floating their labels
          // in a shared area away from the arrows.
          if (force.fx === 0 && force.fy !== 0) {
            labelX = ox + (force.id === 'weight' ? -38 : 22);
            labelY = oy + dy * 0.75;
          } else {
            labelX = ox + Math.sign(force.fx || -1) * Math.max(20, Math.abs(dx) * 0.6);
            labelY = oy + (force.id === 'floor' ? 22 : force.id === 'friction' ? -22 : -18);
            if (force.id === 'friction' || force.id === 'floor') labelX = Math.min(-82, ox + dx * 0.7 - 16);
          }
        }
        label.update(force.latex, labelX, labelY);
      });
      if (api.clock.playing) paused = false;
      if (updateReadouts) analysis.update(bodyAnalysis(kind, params, state, g, selected, words, { paused, ended: time >= endTime(kind, params, g) }));
    }
    if (updateReadouts) {
      updateCalculation();
      readings[0].set(state.acceleration);
      topAcceleration?.set(state.topAcceleration); relativeSlip?.set(state.relativeDisplacement);
      readings[1].set(kind === 'stacked' ? state.threshold : state.tension);
      const feedback = time >= endTime(kind, params, g) ? state.slipping ? words.slipCutoff : words.cutoff : state.resting ? words.resting : state.slipping ? words.slipping : words.moving;
      setText(api.feedback, feedback);
      api.setDescription(`${words[`${kind}Problem`].replaceAll('$', '')} ${feedback} a = ${format(state.acceleration)} m/s².`);
    }
  }
  function setLanguage(next) {
    words = strings[next]; api.setLanguage(next);
    for (const spec of specs) controls.get(spec.key).localize(words[spec.key], spec.unit);
    if (direction) { directionLabel.textContent = words.direction; down.textContent = words.down; up.textContent = words.up; direction.value = String(params.direction); }
    problemHeading.textContent = words.problem; problemText.replaceChildren(...mathText('div', '', words[`${kind}Problem`]).children);
    summary.textContent = words.solution; calculationTitle.textContent = words.computeAcceleration; steps.replaceChildren(...solutionSteps(kind, words).map(step => {
      const item = element('li', step.math ? 'equation' : '');
      if (step.heading) item.append(element('h3', '', step.text));
      else if (step.math) item.append(renderLatex(step.text, 'block')); else item.textContent = step.text;
      return item;
    }));
    readings[0].localize(words[kind === 'stacked' ? 'bottomAcceleration' : 'acceleration'], 'm/s²');
    topAcceleration?.localize(words.topAcceleration, 'm/s²'); relativeSlip?.localize(words.relativeDisplacement, 'm');
    bonusTitle.textContent = words.bonus; releaseNote.textContent = words.releaseNote;
    if (slidingNote) slidingNote.textContent = words.slidingModel;
    if (slipPlayback) slipPlayback.textContent = words.slowSlip;
    readings[1].localize(words[kind === 'stacked' ? 'threshold' : 'tension'], 'N');
    api.liveMark.textContent = next === 'he' ? 'מערכות חיכוך' : 'Friction systems'; api.modelText.replaceChildren(...mathText('div', '', words[`${kind}About`]).children); hint.textContent = words.hint;
    render(api.clock.time);
  }
  setLanguage(lang); api.clock.reset();
  return { reset, setLanguage, dispose: () => api.dispose() };
}
