import { prepareSketchOutlines } from '../../core/sketch.js';
import { geometryLayer, geometryLabel, angleGuide, dimensionGuide, showInitialGeometry } from '../../core/geometry.js';
import { renderMath, identifier, subscript } from '../../core/math.js';
import { motionModel } from '../../core/motion-graphs.js';
import { physicsConfig } from '../../config.js';
import { createExperiment } from '../../core/experiment.js';
import { parameter, metric } from '../../core/controls.js';
import { element, button, setText, svgElement as s, svgText } from '../../core/dom.js';
import { translator, format } from '../../core/i18n.js';
import { defaultParameters, projectileState, flightDuration, shotOutcome, velocityComponents } from './physics.js';
import { strings } from './strings.js';
import { createBodyAnalysis } from '../../core/body-analysis.js';
import { motionAnalysis } from './analysis.js';
export function mount({ root, lang }) {
  let params = { ...defaultParameters }, previous = null, showPrevious = true, showTrail = false, showComponents = true;
  const gravity = physicsConfig.gravity;
  let words = strings[lang], t = translator(lang), scene = null;
  const controls = new Map();
  const api = createExperiment({ root, lang, system: 'basketball', motion: () => motionModel(time => { const state = projectileState(params, time, gravity); return [[state.x, state.y], [state.vx, state.vy], [state.ax, state.ay]]; }, { components: ['graphHorizontal', 'graphVertical'], note: 'graphProjectileNote' }), duration: () => flightDuration(params, gravity), render, reset: () => reset(), defaults, viewBox: '25 55 750 425' });
  let selected = false, pausedForAnalysis = false;
  const hint = element('p', 'analysis-hint'); hint.id = 'basketball-selection-hint'; api.stageColumn.append(hint);
  const analysis = createBodyAnalysis({ parent: api.stageColumn, signal: api.signal, id: 'basketball-analysis', onClose: () => clearSelection(true) });
  api.svg.setAttribute('role', 'group');
  function clearSelection(restoreFocus = false) {
    if (!selected) return;
    selected = false; pausedForAnalysis = false; analysis.hide(); render(api.clock.time);
    if (restoreFocus) scene.ball.focus({ preventScroll: true });
  }
  function selectBall() {
    pausedForAnalysis = api.clock.playing;
    if (api.clock.playing) api.clock.pause();
    selected = true; render(api.clock.time);
  }
  function isBall(target) {
    for (let node = target; node && node !== api.svg; node = node.parentNode) if (node === scene.ball) return true;
    return false;
  }
  // Delegate to the stable SVG: parameter changes rebuild the ball without retaining old listeners.
  api.svg.addEventListener('click', event => isBall(event.target) ? selectBall() : clearSelection(), { signal: api.signal });
  api.svg.addEventListener('keydown', event => {
    if (isBall(event.target) && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); selectBall(); }
  }, { signal: api.signal });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && selected && !event.defaultPrevented) { event.preventDefault(); clearSelection(true); }
  }, { signal: api.signal });
  const xMetric = metric(words.x, t('meters'), 'x'), yMetric = metric(words.y, t('meters'), 'y');
  api.metrics.append(xMetric.root, yMetric.root);
  const specs = [
    { key: 'speed', symbol: 'v_0', min: 1, max: 15, step: 0.1, unit: 'ms' },
    { key: 'angle', symbol: 'θ', min: 5, max: 85, step: 1, unit: '°' },
    { key: 'releaseHeight', symbol: 'y_0', min: 0.5, max: 5, step: 0.1, unit: 'meters' },
    { key: 'hoopHeight', symbol: 'h', min: 0.5, max: 5, step: 0.1, unit: 'meters' },
    { key: 'distance', symbol: 'd', min: 1, max: 15, step: 0.1, unit: 'meters' },
  ];
  const advanced = element('details', 'advanced-controls'); const summary = element('summary', '', t('advanced')); const fields = element('div', 'advanced-fields');
  advanced.append(summary, fields);
  for (const [index, spec] of specs.entries()) {
    const control = parameter({ ...spec, id: `basketball-${spec.key}`, label: words[spec.key], unit: spec.unit === '°' ? '°' : t(spec.unit), value: params[spec.key], signal: api.signal, onChange(v) {
      remember(); pausedForAnalysis = false; params[spec.key] = v; buildScene(); api.clock.reset();
    } });
    controls.set(spec.key, control); (index < 2 ? api.parameters : fields).append(control.root);
  }
  api.parameters.append(advanced);
  const compare = element('label', 'compare-toggle'); const checkbox = element('input'); checkbox.type = 'checkbox'; checkbox.checked = true;
  const compareText = element('span', '', words.compare); compare.append(checkbox, compareText); api.parameters.append(compare);
  checkbox.addEventListener('change', () => { showPrevious = checkbox.checked; render(api.clock.time); }, { signal: api.signal });
  const trailToggle = element('label', 'compare-toggle'); const trailCheckbox = element('input');
  trailCheckbox.type = 'checkbox'; trailCheckbox.id = 'basketball-trail'; trailCheckbox.checked = showTrail;
  const trailText = element('span', '', words.trail); trailToggle.append(trailCheckbox, trailText); api.parameters.append(trailToggle);
  trailCheckbox.addEventListener('change', () => { showTrail = trailCheckbox.checked; render(api.clock.time); }, { signal: api.signal });
  const componentToggle = element('label', 'compare-toggle');
  const componentCheckbox = element('input'); componentCheckbox.type = 'checkbox'; componentCheckbox.id = 'basketball-components'; componentCheckbox.checked = true;
  const componentText = element('span'); componentToggle.append(componentCheckbox, componentText); api.parameters.append(componentToggle);
  componentCheckbox.addEventListener('change', () => { showComponents = componentCheckbox.checked; render(api.clock.time); }, { signal: api.signal });
  const componentPanel = element('section', 'projectile-components');
  const componentHeading = element('h2');
  const pointControls = element('div', 'trajectory-points');
  const specialPoints = [
    { id: 'release', label: 'inspectRelease', time: () => 0 },
    { id: 'peak', label: 'inspectPeak', time: () => velocityComponents(params).vy / gravity },
    { id: 'hoop', label: 'inspectHoop', time: () => params.distance / velocityComponents(params).vx },
    { id: 'landing', label: 'inspectLanding', time: () => flightDuration(params, gravity) },
  ];
  for (const point of specialPoints) {
    point.button = button('', 'button secondary'); point.button.id = `basketball-${point.id}`;
    point.button.addEventListener('click', () => {
      if (point.time() > flightDuration(params, gravity)) return;
      pausedForAnalysis = false;
      api.clock.reset(); api.clock.step(point.time());
    }, { signal: api.signal });
    pointControls.append(point.button);
  }
  componentPanel.append(componentHeading, pointControls); api.stageColumn.append(componentPanel);
  function remember() { if (api.clock.time > 0) previous = { params: { ...params }, time: api.clock.time }; }
  function reset() { pausedForAnalysis = false; api.clock.reset(); }
  function defaults() {
    showTrail = false; trailCheckbox.checked = false;
    showComponents = true; componentCheckbox.checked = true;
    pausedForAnalysis = false; previous = null; params = { ...defaultParameters }; for (const [key, control] of controls) control.update(params[key]);
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
    s('line', { x1: X(0), x2: X(0), y1: Y(params.releaseHeight), y2: 410, stroke: '#287960', 'stroke-dasharray': '4 5' }, svg);
    svgText(svg, X(0) + 12, (Y(params.releaseHeight) + 410) / 2 + 14, `y₀ = ${format(params.releaseHeight, 1)} m`, { 'text-anchor': 'start', class: 'dimension height-label geometry-release' });
    s('circle', { cx: X(0), cy: 410, r: 3, fill: '#668363' }, svg);
    const hx = X(params.distance), hy = Y(params.hoopHeight);
    const flightRegions = Array.from({ length: 16 }, (_, i) => {
      const samples = [i, i + 0.5, i + 1].map(n => projectileState(params, end * n / 16, gravity));
      const xs = samples.map(state => X(state.x)), ys = samples.map(state => Y(state.y));
      return { left: Math.min(...xs) - 24, top: Math.min(...ys) - 24,
        width: Math.max(...xs) - Math.min(...xs) + 48, height: Math.max(...ys) - Math.min(...ys) + 48 };
    });
    api.setGraphObstacles([...flightRegions,
      { left: hx - 30, top: hy - 50, width: 90, height: 410 - hy + 85 },
      { left: 45, top: 410, width: 710, height: 65 }]);
    s('path', { d: `M ${hx + 24} ${hy - 35} v ${410 - hy + 35} h -30`, stroke: '#8a9e80', 'stroke-width': 4, fill: 'none' }, svg);
    s('line', { x1: hx + 24, x2: hx + 24, y1: hy - 38, y2: hy + 7, stroke: '#607957', 'stroke-width': 5 }, svg);
    s('path', { d: `M ${hx - 15} ${hy + 2} l 6 28 h 19 l 6 -28 M ${hx - 12} ${hy + 13} l 25 10 M ${hx - 8} ${hy + 23} l 24 -10`, fill: 'none', stroke: '#9eac92', 'stroke-width': 1.4 }, svg);
    s('ellipse', { cx: hx, cy: hy, rx: 19, ry: 4, fill: 'none', stroke: '#bb8054', 'stroke-width': 3 }, svg);
    svgText(svg, hx - 12, hy + 55, `h = ${format(params.hoopHeight, 1)} m`, { 'text-anchor': 'end', class: 'dimension height-label geometry-height' });
    const paths = s('g', { 'clip-path': 'url(#shot-clip)' }, svg);
    const progressClip = s('clipPath', { id: 'shot-progress' }, defs);
    const progress = s('rect', { x: 0, y: 0, width: 0, height: 480 }, progressClip);
    const old = s('path', { fill: 'none', stroke: '#8c9b8b', opacity: 0.5, 'stroke-width': 2, 'stroke-dasharray': '3 7' }, paths);
    const path = s('path', { class: 'shot-trajectory', 'clip-path': 'url(#shot-progress)', fill: 'none', stroke: '#6f8e65', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, paths);
    // Fixed simulated-time samples, independent of frame rate and playback speed.
    const trail = s('g', { class: 'basketball-trail', 'aria-hidden': 'true', 'pointer-events': 'none' }, paths);
    const trailDots = [];
    for (let sample = 0; sample / 10 <= end; sample++) {
      const state = projectileState(params, sample / 10, gravity);
      trailDots.push(s('circle', { cx: X(state.x), cy: Y(state.y), r: 3.5, fill: '#365f50', display: 'none' }, trail));
    }
    const orientation = s('g', { class: 'motion-orientation', transform: 'translate(680 465)', display: 'none', 'aria-hidden': 'true', 'pointer-events': 'none' }, svg);
    s('path', { d: 'M 0 0 H 40 M 33 -5 L 40 0 L 33 5 M 0 0 V -24 M -5 -17 L 0 -24 L 5 -17', fill: 'none', stroke: '#526452', 'stroke-width': 2 }, orientation);
    svgText(orientation, 48, 5, '+x'); svgText(orientation, -8, -30, '+y');
    const ball = s('g', { role: 'button', tabindex: 0, class: 'selectable-ball', 'aria-describedby': hint.id, 'aria-controls': 'basketball-analysis' }, svg);
    s('circle', { r: 32, class: 'ball-hit', fill: 'transparent' }, ball);
    s('circle', { r: 24, class: 'ball-selection', fill: 'none', stroke: '#203c35', 'stroke-width': 2, 'stroke-dasharray': '5 3', 'pointer-events': 'none' }, ball);
    const artwork = s('g', { 'pointer-events': 'none', transform: 'scale(1.5)' }, ball);
    s('circle', { r: 12, fill: '#e3a06a', stroke: '#b77a4b', 'stroke-width': 1 }, artwork);
    s('path', { d: 'M -10 -6 Q 0 5 10 -6 M -11 4 L 11 4 M 0 -12 Q -6 0 2 12', fill: 'none', stroke: '#a4673e', 'stroke-width': 1 }, artwork);
    const components = s('g', { class: 'velocity-components', 'pointer-events': 'none', 'aria-hidden': 'true' }, svg);
    const horizontalArrow = s('path', { class: 'horizontal-velocity' }, components);
    const verticalArrow = s('path', { class: 'vertical-velocity' }, components);
    function velocityLabel(axis, className) {
      const label = svgText(components, 0, 0, 'v', { class: `velocity-label ${className}` });
      const subscript = s('tspan', { dy: '0.3em', 'font-size': '70%' }, label);
      subscript.textContent = axis;
      return label;
    }
    const horizontalLabel = velocityLabel('x', 'horizontal-velocity');
    const verticalLabel = velocityLabel('y', 'vertical-velocity');
    // One common scale preserves the ratio of the two velocity components.
    const velocityScale = 65 / Math.max(params.speed, Math.hypot(vy, Math.sqrt(vy * vy + 2 * gravity * params.releaseHeight)));
    const geometry = geometryLayer(svg);
    const launchX = X(0), launchY = Y(params.releaseHeight), angle = params.angle * Math.PI / 180;
    const speedGeometry = s('g', { class: 'geometry-speed' }, geometry);
    const arrowX = launchX + 85 * Math.cos(angle), arrowY = launchY - 85 * Math.sin(angle);
    s('path', { class: 'geometry-reference', d: `M ${launchX + 18} ${launchY} H ${launchX + 100}` }, geometry);
    s('path', { class: 'geometry-guide', d: `M ${launchX} ${launchY} L ${arrowX} ${arrowY} m ${-12 * Math.cos(angle - 0.4)} ${12 * Math.sin(angle - 0.4)} L ${arrowX} ${arrowY} l ${-12 * Math.cos(angle + 0.4)} ${12 * Math.sin(angle + 0.4)}` }, speedGeometry);
    angleGuide(s('g', { class: 'geometry-angle' }, geometry), launchX, launchY, 42, -angle, 0, `θ = ${format(params.angle, 0)}°`, launchX + 95, launchY + 22);
    geometryLabel(speedGeometry, arrowX + 12, arrowY - 12, `v₀ = ${format(params.speed, 1)} m/s`, 'start');
    dimensionGuide(s('g', { class: 'geometry-distance' }, geometry), launchX, 462, hx, 462, `d = ${format(params.distance, 1)} m`);
    // Static sampled paths are rebuilt only when launch parameters change.
    path.setAttribute('d', pathData(params, end, X, Y));
    old.setAttribute('d', previous ? pathData(previous.params, previous.time, X, Y) : '');
    prepareSketchOutlines(api.svg);
    scene = { X, Y, old, path, progress, ball, artwork, orientation, trailDots, visibleTrail: 0, geometry, components, horizontalArrow, verticalArrow, horizontalLabel, verticalLabel, velocityScale };
  }
  function pathData(p, time, X, Y) {
    const points = [], end = Math.min(time, flightDuration(p, gravity));
    for (let i = 0; i <= 160; i++) {
      const state = projectileState(p, end * i / 160, gravity);
      points.push(`${i ? 'L' : 'M'} ${X(state.x).toFixed(2)} ${Y(Math.max(0, state.y)).toFixed(2)}`);
    }
    return points.join(' ');
  }
  function render(time, { updateReadouts = true } = {}) {
    if (!scene) return;
    showInitialGeometry(scene.geometry, time, api.clock.playing);
    const state = projectileState(params, time, gravity), outcome = shotOutcome(params, gravity);
    scene.components.setAttribute('display', showComponents ? 'inline' : 'none');
    const bx = scene.X(state.x), by = scene.Y(Math.max(0, state.y));
    scene.components.setAttribute('transform', `translate(${bx} ${by})`);
    const dx = state.vx * scene.velocityScale, dy = -state.vy * scene.velocityScale;
    const arrow = (x, y) => {
      const length = Math.hypot(x, y);
      if (length < 0.001) return '';
      const ux = x / length, uy = y / length, head = Math.min(8, length * 0.45);
      return `M 0 0 L ${x} ${y} M ${x - head * ux - head * uy / 2} ${y - head * uy + head * ux / 2} L ${x} ${y} L ${x - head * ux + head * uy / 2} ${y - head * uy - head * ux / 2}`;
    };
    scene.horizontalArrow.setAttribute('d', arrow(dx, 0)); scene.verticalArrow.setAttribute('d', arrow(0, dy));
    scene.horizontalLabel.setAttribute('x', dx + 7); scene.horizontalLabel.setAttribute('y', -8);
    scene.verticalLabel.setAttribute('x', -24); scene.verticalLabel.setAttribute('y', dy + (dy > 0 ? 18 : -8));
    if (updateReadouts) {
      const end = flightDuration(params, gravity);
      const hoopAvailable = specialPoints[2].time() <= end;
      specialPoints[2].button.disabled = !hoopAvailable;
      specialPoints[2].button.title = hoopAvailable ? '' : words.hoopUnavailable;
      const activePoint = specialPoints.find(point => Math.abs(point.time() - time) < 1e-9);
      for (const point of specialPoints) point.button.setAttribute('aria-pressed', String(point === activePoint));

    }
    scene.progress.setAttribute('width', scene.X(state.x));
    const visibleTrail = showTrail ? Math.min(scene.trailDots.length, Math.floor((time + 1e-9) * 10) + 1) : 0;
    for (let sample = Math.min(scene.visibleTrail, visibleTrail); sample < Math.max(scene.visibleTrail, visibleTrail); sample++) {
      scene.trailDots[sample].setAttribute('display', sample < visibleTrail ? 'inline' : 'none');
    }
    scene.visibleTrail = visibleTrail;
    const oldDisplay = showPrevious && previous ? 'inline' : 'none';
    if (scene.old.getAttribute('display') !== oldDisplay) scene.old.setAttribute('display', oldDisplay);
    scene.ball.setAttribute('transform', `translate(${scene.X(state.x)} ${scene.Y(Math.max(0, state.y))})`);
    scene.artwork.setAttribute('transform', `rotate(${time * 110}) scale(1.5)`);
    scene.ball.setAttribute('aria-label', words.ballLabel);
    scene.ball.setAttribute('aria-pressed', String(selected));
    scene.orientation.setAttribute('display', selected ? 'inline' : 'none');
    if (api.clock.playing) pausedForAnalysis = false;
    if (selected && updateReadouts) analysis.update(motionAnalysis(words, { paused: pausedForAnalysis, ended: time >= flightDuration(params, gravity) }));
    if (updateReadouts) {
      xMetric.set(state.x); yMetric.set(Math.max(0, state.y));
      const key = time === 0 ? 'ready' : time >= outcome.time ? outcome.key : time >= flightDuration(params, gravity) ? 'short' : 'moving';
      if (api.feedback.textContent !== words[key]) setText(api.feedback, words[key]);
      api.setDescription(words.description(format(state.x), format(Math.max(0, state.y))));
    }
  }
  function setLanguage(next) {
    words = strings[next]; t = translator(next); api.setLanguage(next); hint.textContent = words.selectHint;
    for (const spec of specs) controls.get(spec.key).localize(words[spec.key], spec.unit === '°' ? '°' : t(spec.unit));
    xMetric.localize(words.x, t('meters')); yMetric.localize(words.y, t('meters'));
    componentText.textContent = words.showComponents; componentHeading.textContent = words.componentsTitle;
    componentPanel.setAttribute('aria-label', words.componentsTitle);
    for (const point of specialPoints) {
      point.button.replaceChildren(element('span', '', words[point.label]));
      if (point.id === 'peak') {
        const math = renderMath({ label: 'y max', expression: subscript(identifier('y'), ['mi', { mathvariant: 'normal' }, 'max']) });
        math.setAttribute('display', 'inline'); math.setAttribute('class', 'quantity-symbol');
        point.button.append(math);
      }
      point.button.setAttribute('aria-label', words[point.label]);
    }
    summary.textContent = t('advanced'); compareText.textContent = words.compare; trailText.textContent = words.trail; api.modelText.textContent = words.about; api.liveMark.textContent = words.caption;
    render(api.clock.time);
  }
  buildScene(); setLanguage(lang); api.clock.reset();
  return { reset, setLanguage, dispose: () => api.dispose() };
}
