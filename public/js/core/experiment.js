import { element, button, svgElement, setText } from './dom.js';
import { metric } from './controls.js';
import { translator } from './i18n.js';
import { createClock } from './clock.js';
import { createMotionGraphs } from './motion-graphs.js';
import { createQuiz } from './quiz.js';
const transportPaths = {
  play: 'M8 5v14l11-7Z',
  pause: 'M7 5h3v14H7ZM14 5h3v14h-3Z',
  step: 'M5 5v14l10-7ZM17 5h2v14h-2Z',
  reset: 'M4 10a8 8 0 1 1 1 8M4 4v6h6',
  replay: 'M4 10a8 8 0 1 1 1 8M4 4v6h6',
};
const transportLabels = new WeakMap();
function labelTransport(control, label, icon) {
  const key = `${icon}:${label}`;
  if (transportLabels.get(control) === key) return;
  transportLabels.set(control, key);
  const svg = svgElement('svg', { viewBox: '0 0 24 24', class: 'transport-icon', 'aria-hidden': 'true', focusable: 'false' });
  svgElement('path', { d: transportPaths[icon], fill: icon === 'reset' || icon === 'replay' ? 'none' : 'currentColor', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
  control.replaceChildren(svg, element('span', '', label));
}
// Shared shell; only a demo knows its physical model, drawing and duration.
export function createExperiment({ root, lang, system, duration, render, reset, defaults, motion, viewBox = '0 0 800 480', mobileViewBox = viewBox }) {
  const controller = new AbortController(); const { signal } = controller;
  let currentLang = lang, t = translator(lang), statusKey = 'ready';
  const layout = element('div', 'experiment-layout');
  const stageColumn = element('section', 'stage-column');
  const stage = element('div', 'stage');
  const stageHead = element('div', 'stage-heading');
  const status = element('span', 'status-pill', t('ready'));
  const liveMark = element('span', 'stage-caption');
  stageHead.append(status, liveMark);
  const svg = svgElement('svg', { viewBox, role: 'img', 'aria-label': t('stage'), class: 'system-svg', direction: 'ltr' });
  const narrowScreen = matchMedia('(max-width: 600px)');
  const resizeDiagram = () => svg.setAttribute('viewBox', narrowScreen.matches ? mobileViewBox : viewBox);
  narrowScreen.addEventListener?.('change', resizeDiagram, { signal });
  resizeDiagram();
  const accessible = element('p', 'sr-only');
  stage.append(stageHead, svg, accessible);
  const transport = element('div', 'transport');
  const play = button(t('play'), 'button primary'); const step = button(t('step'), 'button secondary'); const restart = button(t('reset'), 'button secondary');
  labelTransport(play, t('play'), 'play');
  labelTransport(step, t('step'), 'step');
  labelTransport(restart, t('reset'), 'reset');
  const rateWrap = element('label', 'playback'); const rateLabel = element('span', '', t('speed'));
  const rate = element('select'); rate.id = 'playback-rate';
  const normal = element('option', '', t('normal')); normal.value = '1';
  const slow = element('option', '', t('slow')); slow.value = '0.25'; rate.append(normal, slow); rateWrap.append(rateLabel, rate);
  transport.append(play, step, restart);
  stage.append(transport);
  const metrics = element('div', 'metrics'); const timeMetric = metric(t('time'), t('seconds'), 't'); metrics.append(timeMetric.root);
  const feedback = element('p', 'feedback'); feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite');
  const reduced = element('p', 'reduced-note', t('reduced')); reduced.hidden = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  stageColumn.append(stage, rateWrap, metrics, feedback, reduced);
  const panel = element('aside', 'control-panel');
  const panelTitle = element('h2', '', t('parameters')); const panelNote = element('p', 'panel-note', t('parametersNote'));
  const parameters = element('div', 'parameters');
  const quiz = system ? createQuiz({ system, lang, signal }) : null;
  const defaultButton = button(t('defaults'), 'text-button');
  const resetNote = element('p', 'reset-note', t('defaultNote'));
  const assumptions = element('details', 'model-notes'); const summary = element('summary', '', t('assumptions')); const modelText = element('p');
  assumptions.append(summary, modelText); panel.append(panelTitle, panelNote, parameters, defaultButton, resetNote, assumptions);
  layout.append(stageColumn, panel); root.append(layout);
  if (quiz) root.append(quiz.root);
  const stackedLayout = matchMedia('(max-width: 900px), (max-width: 1000px) and (max-height: 600px) and (orientation: landscape)');
  function placeParameters() {
    if (stackedLayout.matches) {
      stageColumn.insertBefore(panel, rateWrap);
    } else {
      layout.append(panel);
    }
  }
  stackedLayout.addEventListener?.('change', placeParameters, { signal });
  placeParameters();
  let lastReadout = -Infinity;
  const clock = createClock({ duration, onTick(time, playing, frame) {
    // Text is readable at 10 Hz; explicit actions and the final frame are exact.
    const updateReadouts = !frame || !playing || frame.now - lastReadout >= 100;
    if (updateReadouts) { lastReadout = frame?.now ?? -Infinity; timeMetric.set(time); }
    statusKey = playing ? 'running' : clock.ended ? 'finished' : time === 0 ? 'ready' : 'paused';
    setText(status, t(statusKey));
    if (status.getAttribute('data-playing') !== String(playing)) {
      status.classList.toggle('is-running', playing); status.setAttribute('data-playing', String(playing));
    }
    const action = playing ? 'pause' : clock.ended ? 'replay' : 'play';
    labelTransport(play, t(action), action);
    play.setAttribute('aria-pressed', String(playing));
    step.disabled = clock.ended;
    render(time, { updateReadouts });
    graphs?.update(time, time === 0 && !playing);
  } });
  let sceneObstacles = [], obstacleSignature = '';
  function graphObstacles() {
    const matrix = svg.getScreenCTM?.();
    if (!matrix) return [];
    const origin = stage.getBoundingClientRect();
    const rectangles = sceneObstacles.map(rect => {
      const points = [[rect.left, rect.top], [rect.left + rect.width, rect.top + rect.height]].map(([x, y]) => ({
        x: matrix.a * x + matrix.c * y + matrix.e - origin.left,
        y: matrix.b * x + matrix.d * y + matrix.f - origin.top,
      }));
      return { left: points[0].x, top: points[0].y, width: points[1].x - points[0].x, height: points[1].y - points[0].y };
    });
    for (const control of [transport, stageHead]) {
      const bounds = control.getBoundingClientRect();
      rectangles.push({ left: bounds.left - origin.left, top: bounds.top - origin.top, width: bounds.width, height: bounds.height });
    }
    return rectangles;
  }
  const graphs = motion ? createMotionGraphs({ parent: stage, panel, signal, lang, duration, model: motion, time: () => clock.time, obstacles: graphObstacles }) : null;
  const api = { stageColumn, svg, parameters, metrics, feedback, accessible, modelText, liveMark, signal, clock,
    get lang() { return currentLang; },
    setGraphObstacles(rectangles) {
      const signature = JSON.stringify(rectangles);
      if (signature === obstacleSignature) return;
      obstacleSignature = signature; sceneObstacles = rectangles;
      if (stage.getBoundingClientRect) graphs?.fit();
    },
    setSceneViewBox(next, mobile = next) {
      if (viewBox === next && mobileViewBox === mobile) return;
      viewBox = next; mobileViewBox = mobile; resizeDiagram();
    },
    setDescription(text) { setText(accessible, text); if (svg.getAttribute('aria-label') !== text) svg.setAttribute('aria-label', text); },
    setLanguage(next) {
      currentLang = next; t = translator(next);
      quiz?.setLanguage(next);
      graphs?.setLanguage(next);
      panelTitle.textContent = t('parameters'); panelNote.textContent = t('parametersNote');
      defaultButton.textContent = t('defaults'); resetNote.textContent = t('defaultNote'); summary.textContent = t('assumptions');
      rateLabel.textContent = t('speed'); normal.textContent = t('normal'); slow.textContent = t('slow');
      labelTransport(step, t('step'), 'step'); labelTransport(restart, t('reset'), 'reset'); reduced.textContent = t('reduced');
      timeMetric.localize(t('time'), t('seconds')); status.textContent = t(statusKey);
      const action = clock.playing ? 'pause' : clock.ended ? 'replay' : 'play';
      labelTransport(play, t(action), action);
    },
    dispose() { controller.abort(); clock.dispose(); quiz?.root.remove(); layout.remove(); },
  };
  const togglePlayback = () => clock.playing ? clock.pause() : clock.play();
  play.addEventListener('click', togglePlayback, { signal });
  svg.addEventListener('click', event => {
    // Selecting a body keeps its existing analysis interaction.
    for (let target = event.target; target && target !== svg; target = target.parentNode) {
      if (target.getAttribute?.('role') === 'button') return;
    }
    togglePlayback();
  }, { signal });
  step.addEventListener('click', () => clock.step(), { signal });
  restart.addEventListener('click', () => reset(), { signal });
  defaultButton.addEventListener('click', () => defaults(), { signal });
  rate.addEventListener('change', () => clock.setRate(Number(rate.value)), { signal });
  const visibility = () => { if (document.hidden && clock.playing) clock.pause(); };
  document.addEventListener('visibilitychange', visibility, { signal });
  return api;
}
