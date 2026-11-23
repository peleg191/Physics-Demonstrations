import { createPresentationControls, preferredLanguage, saveLanguage } from '../js/core/presentation-controls.js';
import { createQuiz } from '../js/core/quiz.js';
import { createAchievements } from '../js/core/quiz-achievements.js';
import { renderSubjectNavigation } from '../js/core/subject-navigation.js';
import '../js/core/drawer-motion.js';
import { createHydroAnalysis } from './analysis.js';
import { hydroCourse } from './course.js';
import { createHydroHome } from './home.js';
import { advanceBuoyancy, drainDepth, submergedFraction } from './models.js';
import { systems } from './systems.js';

const main = document.querySelector('main');
const home = document.querySelector('#hydro-home');
const demo = document.querySelector('#hydro-demo');
const achievementSlot = document.querySelector('#hydro-achievements');
const root = document.querySelector('#system');
const languageButton = document.querySelector('#language');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const hydraulicDuration = 1.2;
const labels = {
  title: ['Fluid mechanics', 'מכניקת זורמים'],
  back: ['‹ Fluid mechanics collection', '‹ אוסף מכניקת זורמים'],
  mechanics: ['Physics Playground', 'מגרש המשחקים של הפיזיקה'],
  navigation: ['Main navigation', 'ניווט ראשי'],
  collection: ['The collection', 'אוסף הניסויים'],
  mechanicsCollection: ['Mechanics', 'מכניקה'],
  forces: ['Select a piston or the block to show its forces.', 'בחרו בוכנה או את הגוף כדי להציג את הכוחות.'],
  flow: ['Select point 1 or 2 to inspect pressure and motion.', 'בחרו נקודה 1 או 2 כדי לבחון את הלחץ ואת התנועה.'],
  controls: ['Parameters', 'פרמטרים'],
  reset: ['Reset', 'איפוס'],
  open: ['Open outlet', 'פתיחת הפתח'],
  playFlow: ['Play', 'הפעלה'],
  applyForce: ['Apply force', 'הפעלת כוח'],
  resumeForce: ['Resume stroke', 'המשך מהלך הבוכנה'],
  replayForce: ['Apply force again', 'הפעלת כוח מחדש'],
  pause: ['Pause draining', 'השהיית הריקון'],
  release: ['Release block', 'שחרור הגוף'],
  pauseBlock: ['Pause', 'השהיה'],
  resumeBlock: ['Resume', 'המשך'],
  replayBlock: ['Release again', 'שחרור חוזר'],
  resume: ['Resume draining', 'המשך הריקון'],
  empty: ['The water has reached the outlet height.', 'פני המים הגיעו לגובה הפתח.'],
  ready: ['The readings show the flow expected when the outlet opens.', 'הערכים מציינים את הזרימה הצפויה לאחר פתיחת הפתח.'],
  draining: ['As the height above the outlet falls, the jet slows.', 'ככל שגובה פני המים מעל הפתח קטן, הסילון מאט.'],
};

let language = preferredLanguage();
let refreshScene;
const presentation = createPresentationControls({ onChange: () => refreshScene?.() });
const achievements = createAchievements({ lang: language, course: hydroCourse });

let scene;
let currentId;
let values;
let elapsed;
let blockMotion;
let running = false;
let frame = 0;
let observer;

const translate = words => words[language === 'he' ? 1 : 0];
const defaults = system => Object.fromEntries(system.fields.map(({ key, value }) => [key, value]));

function mount() {
  const hash = location.hash.replace(/^#\/?/, '');
  const id = Object.hasOwn(systems, hash) ? hash : null;
  const system = systems[id];
  const hydraulic = id === 'pascal';
  const floating = id === 'buoyancy';
  const flowing = system?.playback === 'flow';
  const playbackId = hydraulic ? 'apply-force' : floating ? 'release' : flowing ? 'play-flow' : id === 'bernoulli' ? 'drain' : null;
  if (id !== currentId) {
    cancelAnimationFrame(frame);
    currentId = id;
    values = system ? defaults(system) : null;
    elapsed = 0;
    blockMotion = undefined;
    running = false;
  } else if (running) {
    cancelAnimationFrame(frame);
    running = false;
  }
  observer?.disconnect();
  scene?.abort();
  scene = new AbortController();
  const { signal } = scene;

  presentation.update(language);
  achievements.setLanguage(language);
  document.querySelector('#preferences').setAttribute('aria-label', translate(labels.navigation));
  document.querySelector('#fluids-collection-link').textContent = translate(labels.collection);
  document.querySelector('#mechanics-link').textContent = translate(labels.mechanicsCollection);
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  renderSubjectNavigation({ subject: 'fluids', demoId: id, lang: language });
  document.querySelector('#brand-name').textContent = translate(labels.mechanics);
  document.title = [system && translate(system.title), translate(labels.title), 'Physics Playground'].filter(Boolean).join(' · ');
  languageButton.textContent = language === 'he' ? 'English' : 'עברית';
  languageButton.lang = language === 'he' ? 'en' : 'he';
  home.hidden = Boolean(system);
  demo.hidden = !system;
  main.classList.toggle('demo-page', Boolean(system));
  main.classList.toggle('hydro-landing', !system);
  main.classList.toggle('home', !system);
  if (!system) {
    root.replaceChildren();
    const view = createHydroHome({ lang: language, translate, defaults, signal, achievements });
    home.replaceChildren(...view.sections);
    refreshScene = view.refreshCovers;
    return;
  }
  achievementSlot.append(achievements);
  home.replaceChildren();
  document.querySelector('#title').textContent = translate(labels.title);
  document.querySelector('#hydro-back').textContent = translate(labels.back);
  root.innerHTML = `
    <div class="demo-title-row">
      <h2 id="system-title">${translate(system.title)}</h2>
      <div class="demo-heading-actions"></div>
    </div>
    <p class="system-description">${translate(system.description)}</p>
    <div class="experiment-layout">
      <div class="stage-column">
        <div class="stage"><canvas width="1120" height="690" role="img" aria-label="${translate(system.title)}"></canvas></div>
        <p class="analysis-hint">${translate(['pascal', 'buoyancy'].includes(id) ? labels.forces : labels.flow)}</p>
        <div class="metrics${floating ? ' buoyancy-metrics' : ''}">${system.metrics.map(([key, name, unit]) => `
          <div class="metric"><span class="metric-label">${translate(name)}</span>
            <span class="metric-value"><span data-metric="${key}"></span><small>${unit}</small></span>
          </div>`).join('')}</div>
        <p class="hydro-status" id="hydro-status"></p>
        <p class="hydro-notes">${translate(system.notes)}</p>
      </div>
      <div class="experiment-sidebar"><aside class="control-panel">
        <h3>${translate(labels.controls)}</h3>
        ${system.fields.map(({ key, label, min, max, step, unit }) => `
          <div class="parameter">
            <div class="parameter-top">
              <label for="${key}">${translate(label)}</label>
              <bdi><output for="${key}" id="${key}-value"></output> ${unit}</bdi>
            </div>
            <input class="range" type="range" id="${key}" min="${min}" max="${max}" step="${step}" value="${values[key]}">
          </div>`).join('')}
        <div class="hydro-actions">
          ${playbackId ? `<button class="button primary" type="button" id="${playbackId}"></button>` : ''}
          <button class="button secondary" type="button" id="reset">${translate(labels.reset)}</button>
        </div>
      </aside></div>
    </div>`;

  const canvas = root.querySelector('canvas');
  const context = canvas.getContext('2d');
  const status = root.querySelector('#hydro-status');
  const drain = root.querySelector('#drain');
  const release = root.querySelector('#release');
  const playback = playbackId && root.querySelector(`#${playbackId}`);
  const formatter = new Intl.NumberFormat(language, { maximumFractionDigits: 3 });
  const metricNodes = system.metrics.map(([key]) => root.querySelector(`[data-metric="${key}"]`));
  const controls = system.fields.map(({ key }) => [key, document.getElementById(key), document.getElementById(key + '-value')]);

  const analysis = createHydroAnalysis({
    id, stage: canvas.parentElement, parent: root.querySelector('.stage-column'), signal, translate, paint,
  });
  const format = value => formatter.format(Math.abs(value) < 1e-10 ? 0 : value);
  function evaluate(parameters, time = 0, motion) {
    const state = { ...parameters };
    if (floating) {
      state.position = motion?.position ?? parameters.immersion / 100;
      state.immersion = submergedFraction(state.position);
      state.velocity = motion?.velocity ?? 0;
      state.onBottom = motion?.onBottom ?? false;
    }
    if (drain) state.depth = drainDepth(parameters.depth, parameters.areaRatio, time);
    const result = system.calculate(state);
    if (hydraulic) {
      const ramp = 0.25;
      state.pressureHighlight = parameters.force > 0 ? Math.min(1, time / ramp) : 0;
      const progress = Math.min(1, Math.max(0, (time - ramp) / (hydraulicDuration - ramp)));
      state.inputTravel = result.net > 1e-8 ? 38 * progress ** 2 * (3 - 2 * progress) : 0;
      state.loadTravel = state.inputTravel * parameters.inputArea / parameters.outputArea;
    }
    return { state, reading: { ...state, ...result } };
  }
  function paint() {
    const { state, reading } = evaluate(values, elapsed, blockMotion);
    system.metrics.forEach(([key, , , scale = 1], i) => {
      metricNodes[i].textContent = format(reading[key] * scale);
    });
    const phase = reducedMotion.matches ? 0 : elapsed;
    if (context) system.draw(canvas, state, reading, phase, analysis.selected, format);
    analysis.update(state, reading, format);
    if ((drain && state.depth === 0) || blockMotion?.settled || (hydraulic && elapsed >= hydraulicDuration)) running = false;
    const message = drain ? (state.depth === 0 ? labels.empty : elapsed > 0 || running ? labels.draining : labels.ready)
      : system.status(reading, state);
    status.textContent = translate(message);
    if (drain) {
      drain.disabled = state.depth === 0;
      drain.textContent = translate(running ? labels.pause : elapsed > 0 ? labels.resume : labels.open);
    }
    if (flowing) playback.textContent = translate(running ? labels.pauseBlock : labels.playFlow);
    if (hydraulic) playback.textContent = translate(running ? labels.pauseBlock : elapsed >= hydraulicDuration ? labels.replayForce
      : elapsed > 0 ? labels.resumeForce : labels.applyForce);
    if (release) {
      release.textContent = translate(running ? labels.pauseBlock : blockMotion?.settled ? labels.replayBlock
        : blockMotion ? labels.resumeBlock : labels.release);
    }
  }

  function stop() {
    cancelAnimationFrame(frame);
    running = false;
  }

  let previous;
  function tick(now) {
    const delta = previous === undefined ? 0 : (now - previous) / 1000;
    if (floating) blockMotion = advanceBuoyancy(blockMotion, values, Math.min(delta, 0.05));
    else elapsed += flowing || hydraulic ? Math.min(delta, 0.1) : delta;
    previous = now;
    paint();
    if (running) frame = requestAnimationFrame(tick);
  }

  for (const [key, input, output] of controls) {
    output.value = formatter.format(values[key]);
    input.addEventListener('input', () => {
      if (!flowing) {
        stop();
        elapsed = 0;
        blockMotion = undefined;
      }
      values[key] = input.valueAsNumber;
      output.value = formatter.format(values[key]);
      paint();
    });
  }
  function applySetup(overrides = {}) {
    stop();
    elapsed = 0;
    blockMotion = undefined;
    values = { ...defaults(system), ...overrides };
    for (const [key, input, output] of controls) {
      input.value = values[key];
      output.value = formatter.format(values[key]);
    }
    paint();
  }
  root.querySelector('#reset').addEventListener('click', () => applySetup(), { signal });
  const quiz = createQuiz({
    system: `hydro-${id}`, lang: language, signal, course: hydroCourse,
    runExperiment(overrides, done) {
      applySetup(overrides);
      done();
    },
    pauseExperiment() { stop(); paint(); },
    observationReadout(question, index) {
      const [key, label, unit, scale = 1] = question.experiment.metric;
      const { reading } = evaluate({ ...defaults(system), ...question.experiment.runs[index].values });
      return `${translate(label)} · ${format(reading[key] * scale)} ${unit}`;
    },
  });
  root.querySelector('.demo-heading-actions').append(quiz.root);
  playback?.addEventListener('click', () => {
    if (running) stop();
    else {
      if (hydraulic && reducedMotion.matches) {
        elapsed = hydraulicDuration;
        paint();
        return;
      }
      if (hydraulic && elapsed >= hydraulicDuration) elapsed = 0;
      if (floating && (!blockMotion || blockMotion.settled)) {
        blockMotion = { position: values.immersion / 100, velocity: 0 };
      }
      running = true;
      previous = undefined;
      frame = requestAnimationFrame(tick);
    }
    paint();
  });

  observer = new ResizeObserver(([{ contentRect }]) => {
    const width = Math.max(1, Math.round(contentRect.width * (devicePixelRatio || 1)));
    canvas.width = width;
    canvas.height = Math.max(1, Math.round(width * 345 / 560));
    paint();
  });
  observer.observe(canvas);
  refreshScene = paint;
  paint();
}

languageButton.addEventListener('click', () => {
  language = language === 'he' ? 'en' : 'he';
  saveLanguage(language);
  mount();
});
window.addEventListener('hashchange', () => {
  mount();
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
});
mount();
