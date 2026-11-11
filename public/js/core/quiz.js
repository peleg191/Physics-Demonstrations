// Version this dependency when the quiz starts using newly supported LaTeX commands.
import { latexExpression } from './latex.js?quiz-math=2';
import { renderMath } from './math.js';
import { element, button, svgElement } from './dom.js';
import { quizzes } from './quiz-data.js';
import { awardQuizBadge, hasQuizBadge } from './quiz-badges.js';
import { readQuizProgress, saveQuizProgress, recordQuizAnswer, selectQuizQuestions, quizQuestionPriority, quizMilestones, quizProgressEvents } from './quiz-progress.js';
import { createQuizJourney, createAchievements } from './quiz-achievements.js';
import { challengeCopy, challengeSteps, challengeComparison, setupDetails, createObservationCoach } from './quiz-experiment-view.js';

const copy = {
  en: {
    title: 'Check your understanding',
    progress: (n, total) => `Question ${n} of ${total}`, check: 'Check answer', next: 'Next question', finish: 'See results',
    correct: 'Correct.', incorrect: 'Not quite.', retry: 'Try again', result: (score, total) => `You answered ${score} of ${total} correctly.`,
    done: 'Keep exploring the simulation, then try again whenever you like.',
    close: 'Close quiz', move: 'Move quiz window. Drag or use the arrow keys.', earned: '★ Star earned! Find it on this simulation’s card in the collection.',
  },
  he: {
    title: 'בודקים את ההבנה',
    progress: (n, total) => `שאלה ${n} מתוך ${total}`, check: 'בדיקת תשובה', next: 'השאלה הבאה', finish: 'הצגת התוצאה',
    correct: 'נכון.', incorrect: 'לא בדיוק.', retry: 'ניסיון נוסף', result: (score, total) => `ענית נכון על ${score} מתוך ${total} שאלות.`,
    done: 'אפשר להמשיך לחקור את ההדמיה ולנסות שוב בכל רגע.',
    close: 'סגירת הבוחן', move: 'הזזת חלון הבוחן. אפשר לגרור או להשתמש במקשי החצים.', earned: '★ זכית בכוכב! הוא יופיע בכרטיס הניסוי באוסף.',
  },
};

Object.assign(copy.en, {
  result: (score, total) => `${score} of ${total} predictions or answers correct on the first attempt.`,
  done: 'Your solved questions are saved. The next set includes only questions you have not solved yet.',
  allSolved: 'You have solved every question!', allSolvedNote: 'Your progress is saved. You can keep exploring or choose a practice mode below.',
  nextSet: 'Start next set', hint: 'Show a hint', reveal: 'Show explanation', retryQuestion: 'Try this question again',
  hintText: 'Focus on the forces and constraints. Distinguish velocity from acceleration, and ask what changes and what stays fixed.',
  selected: 'Your choice', prediction: 'Predict → Observe → Explain', savedPrediction: 'Prediction saved. Run both setups, observe the motion and readouts, then explain your result.',
  returnQuiz: 'Continue challenge',
  watch: 'Running a setup closes this window so you can watch the simulation. Reopen the quiz to continue.',
  challengeTitle: 'Experiment challenge', challengeProgress: (n, total) => `Challenge ${n} of ${total}`,
  predict: 'Make prediction & compare', explain: 'Check explanation', run: n => `Run setup ${n + 1}`, observed: 'Observed',
  setups: 'These experiments restore defaults before applying the settings below. Run either setup again to compare.',
  skip: 'Answer without running the experiment', revisit: 'Experiment challenges', practice: 'Practice all questions',
  practiceNote: 'Practice mode: all ten questions, with unseen questions first, then questions not yet answered correctly. Achievement progress still counts.',
  helped: 'Solved with help', understood: 'Solved without help', waiting: 'Watch both setups before answering. You can pause or scrub the graphs to inspect the motion.',
  experimentError: 'Playback could not start. Your prediction is saved — try this setup again.',
  changedSetup: 'The settings changed during this run. Replay the setup to make a fair comparison.',
});
Object.assign(copy.he, {
  result: (score, total) => `${score} מתוך ${total} תחזיות או תשובות נכונות בניסיון הראשון.`,
  done: 'השאלות שפתרתם נשמרו. במקבץ הבא יופיעו רק שאלות שעדיין לא פתרתם.',
  allSolved: 'פתרתם את כל השאלות!', allSolvedNote: 'ההתקדמות נשמרה. אפשר להמשיך לחקור או לבחור מצב תרגול למטה.',
  nextSet: 'למקבץ הבא', hint: 'הצגת רמז', reveal: 'הצגת הסבר', retryQuestion: 'לנסות שוב',
  hintText: 'ציירו תרשים כוחות וחשבו על אילוצי התנועה. הבדילו בין מהירות לתאוצה, ובדקו מה משתנה ומה נשאר קבוע.',
  selected: 'הבחירה שלכם', prediction: 'משערים ← בודקים ← מסבירים', savedPrediction: 'ההשערה נשמרה. הפעילו את שני מצבי הניסוי, השוו את התנועה ואת הערכים המוצגים והסבירו את התוצאות.',
  returnQuiz: 'המשך האתגר',
  watch: 'אפשר להפעיל את שני מצבי הניסוי מתוך החלון, להשוות ביניהם ולהמשיך להסבר.',
  challengeTitle: 'אתגר ניסוי', challengeProgress: (n, total) => `אתגר ${n} מתוך ${total}`,
  predict: 'שמירת ההשערה ומעבר לניסוי', explain: 'בדיקת ההסבר', run: n => `הפעלת מצב ${n + 1}`, observed: 'נצפה',
  setups: 'בכל הפעלה נטענים ערכי ברירת המחדל, ולאחריהם ההגדרות של מצב הניסוי שנבחר. אפשר לחזור על כל מצב ולהשוות שוב.',
  skip: 'מענה ללא הפעלת הניסוי', revisit: 'אתגרי ניסוי', practice: 'תרגול כל השאלות',
  practiceNote: 'במצב תרגול מופיעות כל עשר השאלות, תחילה שאלות שטרם עניתם עליהן, ואחריהן שאלות שעדיין לא עניתם עליהן נכון. התשובות נחשבות גם להתקדמות בהישגים.',
  helped: 'שאלות שנפתרו בעזרת רמז או ניסיון נוסף', understood: 'שאלות שנפתרו ללא עזרה', waiting: 'הפעילו את שני המצבים לפני שתענו. אפשר להשהות את התנועה ולגרור על הגרפים כדי לבחון רגע מסוים.',
  experimentError: 'לא ניתן להפעיל את הניסוי. ההשערה נשמרה; נסו להפעיל שוב את המצב שנבחר.',
  changedSetup: 'ההגדרות השתנו במהלך הניסוי. הפעילו שוב את אותו מצב כדי להשוות בין המצבים באותם תנאים.',
});

// Authored $...$ spans use semantic MathML; surrounding prose keeps the UI font.
function quizText(tag, className, text) {
  const node = element(tag, className);
  let position = 0;
  for (const match of text.matchAll(/\$([^$]+)\$/g)) {
    if (match.index > position) node.append(element('span', '', text.slice(position, match.index)));
    const math = renderMath({ text: match[1], label: match[1], expression: latexExpression(match[1]) });
    math.setAttribute('display', 'inline'); math.setAttribute('class', 'quiz-math'); node.append(math);
    position = match.index + match[0].length;
  }
  if (position < text.length) node.append(element('span', '', text.slice(position)));
  return node;
}

export function createQuiz({ system, lang, signal, runExperiment, pauseExperiment, resumeExperiment, observationParent, observationBefore, showObservationScene, initialMode = 'short' }) {
  const bank = quizzes[system];
  let language = lang;
  const freshQuestion = () => ({ selected: null, checked: false, assisted: false, attempted: false, firstCorrect: null, revealed: false, hint: false, prediction: null, observed: [false, false], observedTimes: [null, null], explaining: false, skip: false, error: false });
  function newSession(mode = 'short') {
    const progress = readQuizProgress(system);
    const questions = mode === 'practice'
      ? [...bank].sort((a, b) => quizQuestionPriority(progress, a) - quizQuestionPriority(progress, b))
      : mode === 'experiments' ? bank.filter(question => question.experiment) : selectQuizQuestions(system, bank);
    return { ids: questions.map(question => question.id), index: 0, results: [], current: freshQuestion(), mode, completed: false };
  }
  const saved = readQuizProgress(system).active;
  const valid = saved && Array.isArray(saved.ids) && saved.ids.length > 0 && saved.ids.length <= bank.length
    && new Set(saved.ids).size === saved.ids.length && saved.ids.every(id => bank.some(question => question.id === id))
    && Number.isInteger(saved.index) && saved.index >= 0 && saved.index <= saved.ids.length
    && Array.isArray(saved.results) && saved.results.length === saved.index && saved.current && typeof saved.current === 'object'
    && (saved.current.selected === null || Number.isInteger(saved.current.selected) && saved.current.selected >= 0 && saved.current.selected < 3)
    && Array.isArray(saved.current.observed) && saved.current.observed.length === 2;
  let session = valid ? { ...saved, current: { ...freshQuestion(), ...saved.current } } : newSession(initialMode);
  // Older saved challenges repeated the prediction at the end. Preserve earned
  // progress, but start the new observation/explanation flow explicitly.
  if (valid && session.current.prediction !== null && saved.current.explaining === undefined) {
    Object.assign(session.current, { explaining: false, checked: false, selected: null, revealed: false, observed: [false, false], observedTimes: [null, null] });
  }
  let experimentGeneration = 0, watching = false, activeRun = null;
  function persist() { const progress = readQuizProgress(system); progress.active = session; saveQuizProgress(system, progress); }
  function questionNow() { return bank.find(question => question.id === session.ids[session.index]); }
  const root = element('div', 'system-quiz');
  const launcher = button('', 'button secondary quiz-launcher');
  const launcherIcon = svgElement('svg', { class: 'quiz-launcher-icon', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  svgElement('rect', { x: 4, y: 3, width: 16, height: 18, rx: 2 }, launcherIcon);
  svgElement('path', { d: 'm8 9 1 1 2-2M13 9h3m-8 6 1 1 2-2m2 1h3' }, launcherIcon);
  const launcherLabel = element('span'); launcher.append(launcherIcon, launcherLabel);
  const window = element('section', 'quiz-window'); window.hidden = true; window.id = `${system}-quiz-window`;
  window.setAttribute('role', 'dialog'); window.setAttribute('aria-modal', 'false');
  const header = element('div', 'quiz-window-header');
  const title = element('h2'); title.id = `${system}-quiz-title`; title.setAttribute('tabindex', '0');
  window.setAttribute('aria-labelledby', title.id);
  const close = button('×', 'quiz-close');
  const headerIcon = element('span', 'quiz-header-icon', '✓'); headerIcon.setAttribute('aria-hidden', 'true');
  header.append(headerIcon, title, close);
  const body = element('div', 'quiz-body');
  window.append(header, body); root.append(launcher, window);
  launcher.setAttribute('aria-controls', window.id); launcher.setAttribute('aria-expanded', 'false');
  function hide() {
    window.hidden = true; launcher.setAttribute('aria-expanded', 'false'); launcher.focus({ preventScroll: true });
  }
  launcher.addEventListener('click', () => {
    const current = session.current;
    if (questionNow()?.experiment && current.prediction !== null && !current.explaining && !current.skip) showObservation();
    else openQuiz();
  }, { signal });
  close.addEventListener('click', hide, { signal });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); hide(); }
  }, { signal });
  // Nonmodal: only the window catches input; the simulation stays interactive.
  const mobileLayout = matchMedia('(max-width: 600px), (max-width: 1000px) and (max-height: 600px) and (orientation: landscape)');
  let drag = null;
  function move(left, top) {
    const bounds = window.getBoundingClientRect();
    window.style.left = `${Math.max(0, Math.min(left, globalThis.innerWidth - bounds.width))}px`;
    window.style.top = `${Math.max(0, Math.min(top, globalThis.innerHeight - bounds.height))}px`;
    window.style.right = 'auto'; window.style.bottom = 'auto';
  }
  title.addEventListener('pointerdown', event => {
    if (mobileLayout.matches || event.button !== 0) return;
    const bounds = window.getBoundingClientRect();
    drag = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    title.setPointerCapture(event.pointerId); event.preventDefault();
  }, { signal });
  title.addEventListener('pointermove', event => { if (drag) move(event.clientX - drag.x, event.clientY - drag.y); }, { signal });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) title.addEventListener(type, () => { drag = null; }, { signal });
  title.addEventListener('keydown', event => {
    const delta = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }[event.key];
    if (!delta || mobileLayout.matches) return;
    event.preventDefault(); const bounds = window.getBoundingClientRect(); move(bounds.left + delta[0], bounds.top + delta[1]);
  }, { signal });
  function syncLayout() {
    if (mobileLayout.matches) {
      drag = null;
      for (const side of ['left', 'top', 'right', 'bottom']) window.style[side] = '';
    }
    title.setAttribute('aria-label', mobileLayout.matches ? title.textContent : `${title.textContent}. ${copy[language].move}`);
    if (!window.hidden && window.style.left) { const bounds = window.getBoundingClientRect(); move(bounds.left, bounds.top); }
  }
  globalThis.addEventListener?.('resize', syncLayout, { signal });
  const modes = element('div', 'quiz-modes');
  const modeButtons = [];
  for (const [mode, label] of [['short', 'nextSet'], ['experiments', 'revisit'], ['practice', 'practice']]) {
    if (mode === 'experiments' && !runExperiment) continue;
    const control = button('', 'text-button');
    control.addEventListener('click', () => start(mode), { signal });
    modes.append(control); modeButtons.push({ control, label });
  }
  window.insertBefore(modes, body);
  const coach = createObservationCoach({ parent: window, before: body, signal,
    onRun: runSetup, onResume: () => resumeExperiment?.(), onPausePlayback: () => pauseExperiment?.(),
    onExplain() {
      if (!session.current.observed.every(Boolean)) return;
      session.current.explaining = true; activeRun = null; experimentGeneration++; pauseExperiment?.(true); openQuiz(); persist();
    },
    onPause() { pauseExperiment?.(); watching = false; coach.root.hidden = true; hide(); },
  });
  function openQuiz() {
    watching = false; coach.root.hidden = true; window.hidden = false;
    launcher.setAttribute('aria-expanded', 'true'); render(); title.focus({ preventScroll: true });
  }
  function showObservation(scroll = true) {
    watching = true; window.hidden = false; launcher.setAttribute('aria-expanded', 'true');
    render();
    if (scroll) coach.root.focus({ preventScroll: true });
  }
  function runSetup(index) {
    const question = questionNow(), current = session.current;
    if (!question?.experiment || current.prediction === null || index === 1 && !current.observed[0]) return;
    current.explaining = false; current.error = false; activeRun = index;
    const generation = ++experimentGeneration;
    showObservation(false); coach.resetProgress();
    try {
      runExperiment(question.experiment.runs[index].values, result => {
        if (signal.aborted || generation !== experimentGeneration || questionNow()?.id !== question.id) return;
        current.observed[index] = true;
        current.observedTimes[index] = result?.elapsed ?? null;
        activeRun = null; coach.progress(1, false); render(); persist();
      }, { fraction: question.experiment.observationFraction,
        onProgress(fraction, playing) { if (generation === experimentGeneration) coach.progress(fraction, playing); },
        onCancel() { if (generation === experimentGeneration) { activeRun = null; current.error = 'changed'; render(); persist(); } },
      });
    } catch { activeRun = null; current.error = true; render(); }
    persist();
  }
  const journey = element('div', 'quiz-journey-container');
  const collection = createAchievements({ lang, signal });
  window.append(journey, collection);
  function updateJourney() {
    journey.replaceChildren(createQuizJourney(system, language));
    const milestones = quizMilestones(system, bank);
    if (milestones.mastery && !hasQuizBadge(system)) awardQuizBadge(system);
  }
  quizProgressEvents.addEventListener('change', updateJourney, { signal });
  function commitBody(nodes) {
    body.replaceChildren(...nodes);
    body.classList.toggle('is-checked', session.current.checked && session.index < session.ids.length);
    body.classList.toggle('is-result', session.index === session.ids.length);
  }
  function start(mode) {
    if (activeRun !== null || watching) pauseExperiment?.(true);
    experimentGeneration++; activeRun = null; watching = false; coach.root.hidden = true; session = newSession(mode); render(true); persist();
  }
  function render(moveFocus = false) {
    const t = copy[language], current = session.current;
    const activeQuestion = questionNow();
    const isChallenge = Boolean(activeQuestion?.experiment && runExperiment && !current.skip);
    launcherLabel.textContent = isChallenge && current.prediction !== null && !current.explaining ? t.returnQuiz : t.title;
    title.textContent = isChallenge ? t.challengeTitle : t.title;
    window.classList.toggle('is-challenge', isChallenge);
    coach.root.hidden = !watching || !isChallenge || current.explaining;
    body.hidden = !coach.root.hidden;
    window.classList.toggle('is-observing', !coach.root.hidden);
    if (isChallenge && current.prediction !== null) coach.update({ question: activeQuestion, current, lang: language, activeRun, errorText: current.error === 'changed' ? t.changedSetup : t.experimentError });
    for (const { control, label } of modeButtons) { control.textContent = t[label]; control.setAttribute('aria-pressed', String(label === (session.mode === 'short' ? 'nextSet' : session.mode === 'experiments' ? 'revisit' : 'practice'))); }
    syncLayout(); close.setAttribute('aria-label', t.close);
    if (session.index === session.ids.length) {
      const score = session.results.filter(result => result.firstCorrect).length;
      const allSolved = selectQuizQuestions(system, bank).length === 0;
      const result = element('h3', 'quiz-result', session.ids.length ? t.result(score, session.ids.length) : t.allSolved); result.setAttribute('tabindex', '-1');
      const scoreBadge = element('div', 'quiz-result-score', `${score}/${session.ids.length}`); scoreBadge.setAttribute('aria-hidden', 'true');
      const next = button(t.nextSet, 'button primary'); next.addEventListener('click', () => start('short'), { signal });
      const experiments = button(t.revisit, 'button secondary'); experiments.addEventListener('click', () => start('experiments'), { signal });
      const practice = button(t.practice, 'button secondary'); practice.addEventListener('click', () => start('practice'), { signal });
      const helped = session.results.filter(result => result.solved && result.assisted).length;
      const content = [
        ...(session.ids.length ? [scoreBadge] : []), result,
        element('p', 'quiz-intro', allSolved ? t.allSolvedNote : t.done),
        ...(session.ids.length ? [element('p', 'quiz-helped', `${t.helped}: ${helped}`)] : []),
        ...(!allSolved ? [next] : []), ...(runExperiment ? [experiments] : []), practice,
      ];
      if (hasQuizBadge(system)) content.push(element('p', 'quiz-earned', t.earned));
      commitBody(content);
      if (moveFocus) { body.scrollTop = 0; result.focus({ preventScroll: true }); }
      return;
    }
    const question = questionNow();
    const experiment = Boolean(question.experiment && runExperiment && !current.skip);
    const observing = experiment && current.prediction !== null;
    const ready = !observing || current.explaining && current.observed.every(Boolean);
    const assessment = observing && current.explaining ? question.experiment.reasoning : question;
    const progress = element('div', 'quiz-progress');
    const progressLabel = element('span', '', (session.mode === 'experiments' ? t.challengeProgress : t.progress)(session.index + 1, session.ids.length));
    const progressBar = element('progress', 'quiz-progress-bar'); progressBar.max = session.ids.length; progressBar.value = session.index + 1;
    progressBar.setAttribute('aria-label', progressLabel.textContent); progress.append(progressLabel, progressBar); progress.setAttribute('tabindex', '-1');
    const valueControls = [];
    const fieldset = element('fieldset', 'quiz-options');
    const legend = quizText('legend', '', assessment.prompt[language]); fieldset.append(legend);
    fieldset.hidden = observing && !ready;
    const feedback = element('p', 'quiz-feedback'); feedback.setAttribute('role', 'status'); feedback.setAttribute('tabindex', '-1');
    feedback.hidden = !current.checked && !current.hint;
    if (current.checked) {
      const correct = current.selected === assessment.correct;
      const message = current.revealed || correct ? assessment.explanation[language]
        : assessment.feedback?.[language]?.[current.selected] ?? `${t.selected}: ${assessment.options[language][current.selected]}. ${t.hintText}`;
      feedback.append(quizText('span', '', `${correct ? t.correct : t.incorrect} ${message}`));
      feedback.classList.toggle('is-correct', correct); feedback.classList.toggle('is-incorrect', !correct);
    } else if (current.hint) feedback.append(quizText('span', '', question.hint?.[language] ?? t.hintText));
    const finished = current.checked && (current.selected === assessment.correct || current.revealed);
    const action = button(finished ? session.index === session.ids.length - 1 ? t.finish : t.next
      : current.checked ? t.retryQuestion : experiment && !observing ? t.predict : observing ? t.explain : t.check, 'button primary quiz-action');
    action.disabled = current.selected === null || !ready;
    assessment.options[language].forEach((option, optionIndex) => {
      const label = element('label', 'quiz-option');
      const input = element('input'); input.type = 'radio'; input.name = `${system}-quiz-${question.id}`;
      input.value = String(optionIndex); input.checked = current.selected === optionIndex; input.disabled = current.checked;
      input.addEventListener('change', () => {
        current.selected = optionIndex; action.disabled = !ready;
        for (const control of valueControls) control.disabled = control.getAttribute('data-index') === '1' && !current.observed[0];
        for (const option of fieldset.children) if (option !== legend) option.classList.toggle('is-selected', option === label);
        persist();
      }, { signal });
      label.classList.toggle('is-selected', current.selected === optionIndex);
      if (current.checked && (current.revealed || current.selected === assessment.correct) && optionIndex === assessment.correct) label.className += ' is-correct';
      else if (current.checked && optionIndex === current.selected) label.className += ' is-incorrect';
      label.append(input, quizText('span', 'quiz-option-copy', option));
      if (current.checked && (optionIndex === current.selected || current.revealed && optionIndex === assessment.correct)) {
        const state = element('span', 'quiz-option-state', optionIndex === assessment.correct ? '✓' : '×'); state.setAttribute('aria-hidden', 'true'); label.append(state);
      }
      fieldset.append(label);
    });
    const extra = [];
    if (session.mode === 'practice') extra.push(element('p', 'quiz-mode-note', t.practiceNote));
    let challengeIntro = [];
    if (experiment) {
      challengeIntro = [challengeSteps(language, observing ? 2 : 0)];
      if (!observing) {
        const comparison = challengeComparison(question, language, { signal, onRun(index) {
          if (current.selected === null) return;
          current.prediction = current.selected;
          current.firstCorrect = current.selected === question.correct && !current.assisted;
          current.selected = null;
          pauseExperiment?.(true);
          runSetup(index);
          coach.root.focus({ preventScroll: true });
        } });
        for (const [index, control] of [...comparison.children[1].children].entries()) {
          control.setAttribute('data-index', String(index));
          control.disabled = current.selected === null || index === 1 && !current.observed[0];
          valueControls.push(control);
        }
        challengeIntro.push(comparison);
      }
      else {
        const prediction = element('p', 'challenge-prediction-recap');
        prediction.append(element('span', '', `${challengeCopy[language].prediction}: `), quizText('strong', '', question.options[language][current.prediction]));
        challengeIntro.push(prediction);
        const compare = button(challengeCopy[language].back, 'text-button challenge-back');
        compare.addEventListener('click', () => { current.explaining = false; showObservation(); persist(); }, { signal });
        extra.push(compare);
        if (current.checked && current.selected === assessment.correct) extra.push(element('p', 'challenge-reflection', challengeCopy[language][current.prediction === question.correct ? 'matched' : 'revised']));
      }
      if (!observing) extra.push(setupDetails(question, language));
      const skip = button(t.skip, 'text-button quiz-skip');
      skip.addEventListener('click', () => {
        experimentGeneration++; activeRun = null; watching = false; coach.root.hidden = true; current.skip = true;
        if (current.prediction !== null) { current.selected = current.prediction; current.checked = false; }
        render(); persist();
      }, { signal });
      if (!observing) extra.push(skip);
    }
    if (!current.checked) {
      const hint = button(t.hint, 'text-button quiz-hint');
      hint.addEventListener('click', () => { current.hint = true; current.assisted = true; render(); persist(); }, { signal }); extra.push(hint);
    } else if (!finished) {
      const reveal = button(t.reveal, 'text-button quiz-reveal');
      reveal.addEventListener('click', () => { current.revealed = true; current.assisted = true; render(); persist(); }, { signal }); extra.push(reveal);
    }
    action.addEventListener('click', () => {
      if (action.disabled) return;
      const previous = JSON.parse(JSON.stringify(session));
      let outcome = null, completed = false;
      try {
        if (finished) {
          experimentGeneration++; activeRun = null; watching = false; coach.root.hidden = true;
          session.results.push({ id: question.id, firstCorrect: current.firstCorrect === true, solved: current.selected === assessment.correct, assisted: current.assisted });
          session.index++; session.current = freshQuestion();
          if (session.index === session.ids.length && !session.completed) { session.completed = true; completed = true; }
          render(true);
        } else if (current.checked) {
          current.selected = null; current.checked = false; current.assisted = true; render(true);
        } else if (experiment && !observing) {
          current.prediction = current.selected;
          current.firstCorrect = current.selected === question.correct && !current.assisted;
          current.selected = null; activeRun = null; pauseExperiment?.(true); showObservation();
        } else {
          const correct = current.selected === assessment.correct;
          if (current.firstCorrect === null) current.firstCorrect = correct && !current.assisted;
          outcome = { correct, assisted: current.assisted || current.attempted || (observing && current.prediction !== question.correct), investigation: observing && ready && correct };
          current.checked = true; current.attempted = true;
          if (!correct) current.assisted = true;
          render(); body.children[body.children.length - 2].focus({ preventScroll: true });
        }
      } catch (error) { Object.assign(current, previous.current); Object.assign(session, previous, { current }); throw error; }
      if (outcome) recordQuizAnswer(system, question, outcome);
      if (completed && session.mode !== 'experiments') {
        const saved = readQuizProgress(system); saved.sessions++; saveQuizProgress(system, saved);
      }
      persist();
    }, { signal });
    commitBody([progress, ...challengeIntro, fieldset, ...extra, feedback, action]);
    action.hidden = observing && !current.explaining;
    if (moveFocus) { body.scrollTop = 0; window.scrollTop = 0; if (!watching) progress.focus({ preventScroll: true }); }
  }
  render(); updateJourney();
  return { root, setLanguage(next) {
    const previous = language; language = next;
    try { render(); updateJourney(); collection.setLanguage(next); } catch (error) { language = previous; throw error; }
  } };
}
