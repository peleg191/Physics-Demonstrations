import { createExperiment } from '../../core/experiment.js';
import { createBodyAnalysis } from '../../core/body-analysis.js';
import { createEnergyTransfer, energyTransferBounds } from '../../core/energy-transfer.js';
import { parameter, metric } from '../../core/controls.js';
import { element, setText } from '../../core/dom.js';
import { motionModel } from '../../core/motion-graphs.js';
import { format } from '../../core/i18n.js';
import { prepareSketchOutlines } from '../../core/sketch.js';
import { defaults, descent, escape, launcher } from './physics.js';
import { content, wordsFor, workedSolution } from './content.js';
import { createScene } from './scene.js';

const configurations = {
  'energy-incline': { model: descent, parameters: [['mass', 'm', 'kg', 1, 30, 0.5], ['height', 'h', 'm', 2, 12, 0.5], ['angle', 'α', '°', 15, 65, 1]],
    metrics: [['finalSpeed', 'finalSpeed', 'm/s', 'v_f']] },
  'escape-speed': { model: escape, parameters: [['mass', 'm', 'kg', 1, 1000, 1], ['ratio', '', '', 0.4, 1.5, 0.01]],
    metrics: [['escapeSpeed', 'escapeSpeed', 'km/s', 'v_esc']] },
  'spring-launcher': { model: launcher, parameters: [['mass', 'm', 'kg', 1, 30, 0.5], ['stiffness', 'k', 'N/m', 20, 200, 1],
    ['compression', 'd', 'm', 0.2, 1, 0.05], ['angle', 'α', '°', 15, 65, 1]],
    metrics: [['launchSpeed', 'finalSpeed', 'm/s', 'v_B'], ['peak', 'height', 'm', 'h_max']] },
};

export function mountEnergySystem(kind, { root, lang }) {
  const space = kind === 'escape-speed';
  const spring = kind === 'spring-launcher';
  const configuration = configurations[kind];
  const params = { ...defaults[kind] };
  let model = configuration.model(params);
  let words = wordsFor(kind, lang), solution = workedSolution(kind, lang);
  let selected = false, paused = false;
  const api = createExperiment({ root, lang, system: kind, render, reset, defaults: restore, timeScale: space ? 1800 : 1,
    duration: () => model.duration,
    motion: () => motionModel(time => {
      const state = model.sample(time);
      return [[space ? state.position - model.radius : state.position], [state.velocity], [state.acceleration]];
    }, { note: space ? 'graphEscapeNote' : spring ? 'graphTrackNote' : 'graphInclineNote' }),
  });
  api.svg.setAttribute('role', 'group');
  const scene = createScene(api.svg, kind);
  const hint = element('p', 'analysis-hint'); hint.id = `${kind}-hint`; api.stageColumn.append(hint);
  const analysis = createBodyAnalysis({ parent: api.stageColumn, signal: api.signal, id: `${kind}-analysis`, onClose: close });
  scene.mass.setAttribute('aria-controls', analysis.root.id);
  scene.mass.setAttribute('aria-describedby', hint.id);
  scene.mass.addEventListener('click', select, { signal: api.signal });
  scene.mass.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); }
  }, { signal: api.signal });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && selected && !event.defaultPrevented) { event.preventDefault(); close(); }
  }, { signal: api.signal });

  const controls = configuration.parameters.map(([key, symbol, unit, min, max, step]) => {
    const control = parameter({ id: `${kind}-${key}`, label: words[key], symbol, unit, min, max, step,
      value: params[key], signal: api.signal, onChange(value) { params[key] = value; change(); } });
    api.parameters.append(control.root);
    return { key, unit, control };
  });
  let planetControl, planetLabel;
  const planetOptions = new Map();
  if (space) {
    const label = element('label', 'parameter energy-planet-control');
    planetLabel = element('span');
    planetControl = element('select'); planetControl.id = `${kind}-planet`;
    for (const planet of ['mars', 'earth']) {
      const option = element('option'); option.value = planet;
      planetOptions.set(planet, option); planetControl.append(option);
    }
    planetControl.value = params.planet;
    planetControl.addEventListener('change', () => { params.planet = planetControl.value; change(); }, { signal: api.signal });
    label.append(planetLabel, planetControl); api.parameters.append(label);
  }

  const energy = createEnergyTransfer({ api, id: kind, lang, elastic: spring, signed: space,
    onVisibilityChange: () => render(api.clock.time) });
  const readings = [['speed', 'velocity', space ? 'km/s' : 'm/s', 'v'], ...configuration.metrics].map(([key, value, unit, symbol]) => {
    const reading = metric(words[key], unit, symbol);
    api.metrics.append(reading.root);
    return { key, value, unit, reading };
  });
  function reset() { paused = false; api.clock.reset(); }
  function change() { model = configuration.model(params); scene.layout(params, model, words); reset(); }
  function restore() {
    Object.assign(params, defaults[kind]);
    for (const { key, control } of controls) control.update(params[key]);
    if (space) planetControl.value = params.planet;
    change();
  }
  function select() {
    selected = true;
    analysis.reveal();
    if (api.clock.playing) { paused = true; api.clock.pause(); }
    else render(api.clock.time);
  }
  function close() {
    selected = false; paused = false; analysis.hide(); render(api.clock.time);
    scene.mass.focus({ preventScroll: true });
  }
  function feedback(state, ended) {
    if (space) {
      const result = model.energy < 0 ? words.bound : model.energy > 0 ? words.unbound : words.threshold;
      if (!ended) return result;
      return model.turnsInView ? words.turning : `${words.limit} ${result}`;
    }
    if (ended) return words.end;
    if (spring && state.position >= model.rampStart) return words.climb;
    if (spring && state.remaining === 0) return words.coast;
    return words.active;
  }
  function render(time, { updateReadouts = true } = {}) {
    const state = model.sample(time);
    scene.update(state);
    api.setGraphObstacles([
      { left: 295, top: space ? 140 : 90, width: 475, height: space ? 245 : 315 },
      ...(energy.visible ? [energyTransferBounds] : []),
    ]);
    energy.update(state, { updateReadouts, scale: model.energyScale });
    if (api.clock.playing) paused = false;
    if (!updateReadouts) return;
    for (const { value, unit, reading } of readings) {
      const divisor = unit === 'km/s' ? 1e3 : 1;
      reading.set((state[value] ?? model[value]) / divisor);
    }
    const message = feedback(state, time >= model.duration);
    setText(api.feedback, message);
    api.setDescription(`${words.title}. ${message} ${words.speed} ${format(state.velocity / (space ? 1000 : 1))} ${space ? 'km/s' : 'm/s'}.`);
    scene.mass.setAttribute('aria-pressed', String(selected));
    if (selected) {
      const start = content[kind].exampleStart ?? solution.length;
      analysis.update({ title: words.title, close: words.close, notice: paused ? words.paused : '',
        axis: words.note, equations: solution.slice(0, start),
        solutionTitle: words.workedExample, solution: start < solution.length ? solution.slice(start) : undefined });
    }
  }
  function setLanguage(next) {
    words = wordsFor(kind, next); solution = workedSolution(kind, next); api.setLanguage(next);
    for (const { key, unit, control } of controls) control.localize(words[key], unit);
    for (const { key, unit, reading } of readings) reading.localize(words[key], unit);
    if (space) {
      setText(planetLabel, words.planet);
      for (const [planet, option] of planetOptions) setText(option, words[planet]);
    }
    energy.setLanguage(next);
    setText(hint, words.hint); setText(api.modelText, words.note); setText(api.liveMark, words.title);
    scene.mass.setAttribute('aria-label', space ? words.craft : words.block);
    scene.layout(params, model, words);
    render(api.clock.time);
  }

  setLanguage(lang); prepareSketchOutlines(api.svg); reset();
  return { reset, setLanguage, dispose: () => api.dispose() };
}
