import { element, button, svgElement } from './dom.js';
import { metric } from './controls.js';
import { translator } from './i18n.js';
import { createClock } from './clock.js';
// Shared shell; only a demo knows its physical model, drawing and duration.
export function createExperiment({ root, lang, duration, render, reset, defaults, mobileViewBox = '0 0 800 480' }) {
  const controller = new AbortController(); const { signal } = controller;
  let currentLang = lang, t = translator(lang), statusKey = 'ready';
  const layout = element('div', 'experiment-layout');
  const stageColumn = element('section', 'stage-column');
  const stage = element('div', 'stage');
  const stageHead = element('div', 'stage-heading');
  const status = element('span', 'status-pill', t('ready'));
  const liveMark = element('span', 'stage-caption');
  stageHead.append(status, liveMark);
  const svg = svgElement('svg', { viewBox: '0 0 800 480', role: 'img', 'aria-label': t('stage'), class: 'system-svg', direction: 'ltr' });
  const narrowScreen = matchMedia('(max-width: 600px)');
  const resizeDiagram = () => svg.setAttribute('viewBox', narrowScreen.matches ? mobileViewBox : '0 0 800 480');
  narrowScreen.addEventListener?.('change', resizeDiagram, { signal });
  resizeDiagram();
  const accessible = element('p', 'sr-only');
  stage.append(stageHead, svg, accessible);
  const transport = element('div', 'transport');
  const play = button(t('play'), 'button primary'); const step = button(t('step'), 'button secondary'); const restart = button(t('reset'), 'icon-button');
  const rateWrap = element('label', 'playback'); const rateLabel = element('span', '', t('speed'));
  const rate = element('select'); rate.id = 'playback-rate';
  const normal = element('option', '', t('normal')); normal.value = '1';
  const slow = element('option', '', t('slow')); slow.value = '0.25'; rate.append(normal, slow); rateWrap.append(rateLabel, rate);
  transport.append(play, step, restart, rateWrap);
  const metrics = element('div', 'metrics'); const timeMetric = metric(t('time'), t('seconds')); metrics.append(timeMetric.root);
  const feedback = element('p', 'feedback'); feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite');
  const reduced = element('p', 'reduced-note', t('reduced')); reduced.hidden = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  stageColumn.append(stage, transport, metrics, feedback, reduced);
  const panel = element('aside', 'control-panel');
  const panelTitle = element('h2', '', t('parameters')); const panelNote = element('p', 'panel-note', t('parametersNote'));
  const parameters = element('div', 'parameters');
  const defaultButton = button(t('defaults'), 'text-button');
  const resetNote = element('p', 'reset-note', t('defaultNote'));
  const assumptions = element('details', 'model-notes'); const summary = element('summary', '', t('assumptions')); const modelText = element('p');
  assumptions.append(summary, modelText); panel.append(panelTitle, panelNote, parameters, defaultButton, resetNote, assumptions);
  layout.append(stageColumn, panel); root.append(layout);
  const clock = createClock({ duration, onTick(time, playing) {
    timeMetric.set(time);
    statusKey = playing ? 'running' : clock.ended ? 'finished' : time === 0 ? 'ready' : 'paused';
    status.textContent = t(statusKey); status.classList.toggle('is-running', playing);
    play.textContent = t(playing ? 'pause' : clock.ended ? 'replay' : 'play');
    play.setAttribute('aria-pressed', String(playing));
    step.disabled = clock.ended;
    render(time, api);
  } });
  const api = { svg, parameters, metrics, feedback, accessible, modelText, liveMark, signal, clock,
    get lang() { return currentLang; },
    setDescription(text) { accessible.textContent = text; svg.setAttribute('aria-label', text); },
    setLanguage(next) {
      currentLang = next; t = translator(next);
      panelTitle.textContent = t('parameters'); panelNote.textContent = t('parametersNote');
      defaultButton.textContent = t('defaults'); resetNote.textContent = t('defaultNote'); summary.textContent = t('assumptions');
      rateLabel.textContent = t('speed'); normal.textContent = t('normal'); slow.textContent = t('slow');
      step.textContent = t('step'); restart.textContent = t('reset'); reduced.textContent = t('reduced');
      timeMetric.localize(t('time'), t('seconds')); status.textContent = t(statusKey);
      play.textContent = t(clock.playing ? 'pause' : clock.ended ? 'replay' : 'play');
    },
    dispose() { controller.abort(); clock.dispose(); layout.remove(); },
  };
  play.addEventListener('click', () => clock.playing ? clock.pause() : clock.play(), { signal });
  step.addEventListener('click', () => clock.step(), { signal });
  restart.addEventListener('click', () => reset(), { signal });
  defaultButton.addEventListener('click', () => defaults(), { signal });
  rate.addEventListener('change', () => clock.setRate(Number(rate.value)), { signal });
  const visibility = () => { if (document.hidden && clock.playing) clock.pause(); };
  document.addEventListener('visibilitychange', visibility, { signal });
  return api;
}
