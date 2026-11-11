import { element, button, svgElement as s, setText } from './dom.js';
import { format } from './i18n.js';

export const challengeCopy = {
  en: {
    steps: ['Predict', 'Observe', 'Explain'], baseline: 'Baseline', changed: 'Changed', details: 'Setup details',
    reset: 'Each run loads the stated settings from defaults.', change: label => `Changing ${label.toLowerCase()}`,
    prediction: 'Your prediction', run: letter => `Run ${letter}`, replay: letter => `Replay ${letter}`,
    running: letter => `Watching ${letter}…`, played: 'Complete', ready: 'Ready', resume: 'Continue playback',
    pausePlayback: 'Pause playback', paused: 'Paused — continue when ready', explain: 'Explain what happened', pause: 'Pause challenge',
    progress: 'Observation progress', cycle: 's / cycle', back: 'Compare again',
    predictionAction: 'Make prediction & compare', saved: 'Prediction saved', reflection: 'Now explain the physics behind your observation.',
    matched: 'Your prediction matched the result.', revised: 'The result challenged your prediction — that is part of learning.',
  },
  he: {
    steps: ['משערים', 'בודקים', 'מסבירים'], baseline: 'מצב התחלתי', changed: 'לאחר השינוי', details: 'פרטי הניסוי',
    reset: 'בכל הפעלה משוחזרים ערכי ברירת המחדל ואז נטענות ההגדרות של מצב הניסוי שנבחר.', change: label => `משנים: ${label}`,
    prediction: 'ההשערה שלכם', run: letter => `הפעלת ${letter}`, replay: letter => `הפעלה חוזרת של ${letter}`,
    running: letter => `צופים ב־${letter}…`, played: 'הושלם', ready: 'מוכן', resume: 'המשך ההפעלה',
    pausePlayback: 'השהיית התנועה', paused: 'ההפעלה מושהית. אפשר להמשיך כשתרצו.', explain: 'מסבירים מה קרה', pause: 'השהיית האתגר',
    progress: 'התקדמות התצפית', cycle: 'שניות למחזור', back: 'חזרה להשוואה',
    predictionAction: 'שמירת ההשערה ומעבר לניסוי', saved: 'ההשערה נשמרה', reflection: 'כעת הסבירו מדוע התקבלו התוצאות האלה.',
    matched: 'תוצאות הניסוי תואמות את ההשערה שלכם.', revised: 'התוצאה שונה מההשערה שלכם. כדאי לבדוק איזה עיקרון פיזיקלי מסביר את ההבדל.',
  },
};
function playIcon() {
  const svg = s('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false', class: 'challenge-play-icon' });
  s('path', { d: 'm9 5 10 7-10 7Z', fill: 'currentColor' }, svg); return svg;
}
export function challengeSteps(lang, active) {
  const root = element('ol', 'challenge-steps'); root.setAttribute('aria-label', challengeCopy[lang].steps.join(', '));
  challengeCopy[lang].steps.forEach((label, index) => {
    const step = element('li', index === active ? 'is-current' : index < active ? 'is-done' : '');
    if (index === active) step.setAttribute('aria-current', 'step');
    step.append(element('span', 'challenge-step-number', String(index + 1)), element('span', '', label)); root.append(step);
  });
  return root;
}
function valueLabel(question, index) {
  const { change } = question.experiment;
  const value = change.values[index], digits = Number.isInteger(value) ? 0 : Number.isInteger(value * 10) ? 1 : 2;
  return `${format(value, digits)}${change.unit === '°' ? '' : ' '}${change.unit}`.trim();
}
export function setupDetails(question, lang) {
  const t = challengeCopy[lang], root = element('details', 'challenge-details');
  root.append(element('summary', '', t.details), element('p', '', t.reset));
  for (const [index, run] of question.experiment.runs.entries()) root.append(element('p', '', `${index ? 'B' : 'A'} · ${run.label[lang]}`));
  return root;
}
export function challengeComparison(question, lang, { onRun, signal } = {}) {
  const t = challengeCopy[lang], root = element('section', 'challenge-comparison');
  root.setAttribute('aria-label', question.experiment.change.label[lang]);
  root.append(element('p', 'challenge-change-label', t.change(question.experiment.change.label[lang])));
  const values = element('div', 'challenge-values');
  for (let index = 0; index < 2; index++) {
    const item = button('', index ? 'challenge-value is-variant' : 'challenge-value');
    item.setAttribute('aria-label', `${t.run(index ? 'B' : 'A')} · ${valueLabel(question, index)}`);
    item.disabled = true;
    item.addEventListener('click', () => onRun?.(index), { signal });
    item.append(element('span', '', `${index ? 'B' : 'A'} · ${index ? t.changed : t.baseline}`), element('bdi', '', valueLabel(question, index)));
    values.append(item);
  }
  root.append(values); return root;
}

// The coach stays inside the quiz panel throughout both experiment runs.
// Progress updates reuse nodes so playback never steals keyboard focus.
export function createObservationCoach({ parent, before, signal, onRun, onResume, onPausePlayback, onExplain, onPause }) {
  const root = element('section', 'experiment-coach'); root.hidden = true;
  root.setAttribute('role', 'region'); root.setAttribute('tabindex', '-1');
  parent.insertBefore(root, before ?? null);
  let model, ui, key = '', fraction = 0, playing = false;
  function nextAction() {
    if (model.current.observed.every(Boolean)) return onExplain();
    if (model.activeRun !== null && fraction < 1) return playing ? undefined : onResume();
    onRun(model.current.observed[0] ? 1 : 0);
  }
  function updateStatus() {
    if (!ui || !model) return;
    const t = challengeCopy[model.lang], current = model.current;
    ui.buttons.forEach((control, index) => {
      const active = model.activeRun === index;
      control.classList.toggle('is-active', active);
      control.classList.toggle('is-complete', current.observed[index]);
      control.setAttribute('aria-pressed', String(active));
      control.disabled = index === 1 && !current.observed[0];
      const letter = index ? 'B' : 'A';
      const togglesPlayback = active && fraction < 1;
      control.setAttribute('aria-label', `${togglesPlayback ? playing ? t.pausePlayback : t.resume : current.observed[index] ? t.replay(letter) : t.run(letter)} · ${valueLabel(model.question, index)}`);
      ui.icons[index].children[0].setAttribute('d', togglesPlayback && playing ? 'M6 5h4v14H6ZM14 5h4v14h-4Z' : 'm9 5 10 7-10 7Z');
      setText(ui.statuses[index], active && !current.observed[index] ? playing ? t.running(letter) : t.paused : current.observed[index] ? t.played : t.ready);
      const elapsed = current.observedTimes?.[index];
      setText(ui.times[index], model.question.experiment.cyclic && Number.isFinite(elapsed) ? `${format(elapsed, 2)} ${t.cycle}` : '');
    });
    ui.progress.value = fraction;
    ui.progress.hidden = model.activeRun === null;
    const both = current.observed.every(Boolean), running = model.activeRun !== null && fraction < 1;
    ui.next.disabled = !both && running && playing;
    setText(ui.next, both ? t.explain : running ? playing ? t.running(model.activeRun ? 'B' : 'A') : t.resume : t.run(current.observed[0] ? 'B' : 'A'));
    setText(ui.error, model.errorText); ui.error.hidden = !current.error;
  }
  function update(next) {
    model = next;
    const t = challengeCopy[model.lang];
    root.setAttribute('aria-label', `${t.steps[1]} · ${model.question.experiment.goal[model.lang]}`);
    const nextKey = `${model.question.id}:${model.lang}:${model.current.prediction}`;
    if (nextKey !== key) {
      key = nextKey; fraction = 0; playing = false;
      const header = element('div', 'coach-header');
      const pause = button('×', 'coach-pause'); pause.setAttribute('aria-label', t.pause);
      pause.addEventListener('click', onPause, { signal }); header.append(challengeSteps(model.lang, 1), pause);
      const goal = element('h3', 'coach-goal', model.question.experiment.goal[model.lang]);
      const prediction = element('p', 'coach-prediction'); prediction.append(element('span', '', `${t.prediction}: `), element('strong', '', model.question.options[model.lang][model.current.prediction].replaceAll('$', '')));
      const change = element('p', 'challenge-change-label', t.change(model.question.experiment.change.label[model.lang]));
      const runs = element('div', 'coach-runs');
      const buttons = [], statuses = [], times = [], icons = [];
      model.question.experiment.runs.forEach((_, index) => {
        const control = button('', 'quiz-run coach-run');
        control.setAttribute('data-run', String(index));
        const badge = element('span', 'coach-run-letter', index ? 'B' : 'A');
        const content = element('span', 'coach-run-content');
        const value = element('bdi', 'coach-run-value', valueLabel(model.question, index));
        const status = element('span', 'coach-run-status'); const time = element('span', 'coach-run-time');
        content.append(value, status, time); const icon = playIcon(); control.append(badge, content, icon); icons.push(icon);
        control.addEventListener('click', () => {
          if (model.activeRun === index && fraction < 1) { if (playing) onPausePlayback(); else onResume(); }
          else onRun(index);
        }, { signal }); runs.append(control);
        buttons.push(control); statuses.push(status); times.push(time);
      });
      const progress = element('progress', 'coach-progress'); progress.max = 1; progress.setAttribute('aria-label', t.progress);
      const error = element('p', 'quiz-experiment-error', model.errorText); error.setAttribute('role', 'alert');
      const footer = element('div', 'coach-footer'); const next = button('', 'button primary coach-next');
      next.addEventListener('click', nextAction, { signal }); footer.append(setupDetails(model.question, model.lang), next);
      root.replaceChildren(header, goal, prediction, change, runs, progress, error, footer);
      ui = { buttons, statuses, times, icons, progress, error, next };
    }
    updateStatus();
  }
  root.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onPause(); } }, { signal });
  signal.addEventListener('abort', () => root.remove(), { once: true });
  return { root, update, progress(value, isPlaying) { fraction = value; playing = isPlaying; updateStatus(); }, resetProgress() { fraction = 0; playing = true; updateStatus(); } };
}
