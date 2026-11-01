import { renderMath, row, identifier, subscript, trig } from './math.js';
import { element, button, svgElement } from './dom.js';
import { quizzes } from './quiz-data.js';
import { awardQuizBadge } from './quiz-badges.js';

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

// Authored $...$ spans use semantic MathML; surrounding prose keeps the UI font.
function quizText(tag, className, text) {
  const node = element(tag, className);
  const staticCoefficient = () => subscript(identifier('μ'), ['mi', { mathvariant: 'normal' }, 's']);
  const formulas = {
    'mg': row(identifier('m'), identifier('g')),
    'g': identifier('g'),
    'θ': identifier('θ'),
    'mg cos θ': row(identifier('m'), identifier('g'), trig('cos', identifier('θ'))),
    'mg sin θ': row(identifier('m'), identifier('g'), trig('sin', identifier('θ'))),
    'μₛN': row(staticCoefficient(), identifier('N')),
    'tan θ = μₛ': row(trig('tan', identifier('θ')), ['mo', '='], staticCoefficient()),
    'F = −kx': row(identifier('F'), ['mo', '='], ['mo', '−'], identifier('k'), identifier('x')),
    'x = 0': row(identifier('x'), ['mo', '='], ['mn', '0']),
  };
  let position = 0;
  for (const match of text.matchAll(/\$([^$]+)\$/g)) {
    if (match.index > position) node.append(element('span', '', text.slice(position, match.index)));
    const math = renderMath({ text: match[1], label: match[1], expression: formulas[match[1]] });
    math.setAttribute('display', 'inline'); math.setAttribute('class', 'quiz-math'); node.append(math);
    position = match.index + match[0].length;
  }
  if (position < text.length) node.append(element('span', '', text.slice(position)));
  return node;
}

export function createQuiz({ system, lang, signal }) {
  const questions = quizzes[system];
  let language = lang, index = 0, selected = null, checked = false, score = 0;
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
    window.hidden = false; launcher.setAttribute('aria-expanded', 'true'); title.focus({ preventScroll: true });
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
    title.setAttribute('aria-label', mobileLayout.matches ? copy[language].title : `${copy[language].title}. ${copy[language].move}`);
    if (!window.hidden && window.style.left) { const bounds = window.getBoundingClientRect(); move(bounds.left, bounds.top); }
  }
  globalThis.addEventListener?.('resize', syncLayout, { signal });
  function render(moveFocus = false) {
    const t = copy[language]; launcherLabel.textContent = t.title; title.textContent = t.title;
    syncLayout(); close.setAttribute('aria-label', t.close);
    body.replaceChildren();
    body.classList.toggle('is-checked', checked && index < questions.length);
    body.classList.toggle('is-result', index === questions.length);
    if (index === questions.length) {
      const result = element('h3', 'quiz-result', t.result(score, questions.length));
      result.setAttribute('tabindex', '-1');
      const retry = button(t.retry, 'button secondary');
      retry.addEventListener('click', () => { index = 0; selected = null; checked = false; score = 0; render(true); }, { signal });
      const scoreBadge = element('div', 'quiz-result-score', `${score}/${questions.length}`); scoreBadge.setAttribute('aria-hidden', 'true');
      body.append(scoreBadge, result, element('p', 'quiz-intro', t.done), retry);
      if (score === questions.length) body.insertBefore(element('p', 'quiz-earned', t.earned), retry);
      if (moveFocus) { body.scrollTop = 0; result.focus({ preventScroll: true }); }
      return;
    }
    const question = questions[index];
    const progress = element('div', 'quiz-progress');
    const progressLabel = element('span', '', t.progress(index + 1, questions.length));
    const progressBar = element('progress', 'quiz-progress-bar'); progressBar.max = questions.length; progressBar.value = index + 1;
    progressBar.setAttribute('aria-label', t.progress(index + 1, questions.length)); progress.append(progressLabel, progressBar);
    progress.setAttribute('tabindex', '-1');
    const fieldset = element('fieldset', 'quiz-options');
    const legend = quizText('legend', '', question.prompt[language]); fieldset.append(legend);
    const feedback = element('p', 'quiz-feedback'); feedback.setAttribute('role', 'status');
    feedback.setAttribute('tabindex', '-1');
    feedback.hidden = !checked;
    if (checked) {
      feedback.append(quizText('span', '', `${selected === question.correct ? t.correct : t.incorrect} ${question.explanation[language]}`));
      feedback.classList.toggle('is-correct', selected === question.correct);
      feedback.classList.toggle('is-incorrect', selected !== question.correct);
    }
    const action = button(checked ? index === questions.length - 1 ? t.finish : t.next : t.check, 'button primary');
    action.disabled = selected === null;
    question.options[language].forEach((option, optionIndex) => {
      const label = element('label', 'quiz-option');
      const input = element('input'); input.type = 'radio'; input.name = `${system}-quiz-${index}`;
      input.value = String(optionIndex); input.checked = selected === optionIndex; input.disabled = checked;
      input.addEventListener('change', () => {
        selected = optionIndex; action.disabled = false;
        for (const option of fieldset.children) if (option !== legend) option.classList.toggle('is-selected', option === label);
      }, { signal });
      label.classList.toggle('is-selected', selected === optionIndex);
      if (checked && optionIndex === question.correct) label.className += ' is-correct';
      else if (checked && optionIndex === selected) label.className += ' is-incorrect';
      label.append(input, quizText('span', 'quiz-option-copy', option));
      if (checked && (optionIndex === question.correct || optionIndex === selected)) {
        const state = element('span', 'quiz-option-state', optionIndex === question.correct ? '✓' : '×');
        state.setAttribute('aria-hidden', 'true'); label.append(state);
      }
      fieldset.append(label);
    });
    action.addEventListener('click', () => {
      if (selected === null) return;
      if (checked) { index++; selected = null; checked = false; render(true); }
      else {
        checked = true; if (selected === question.correct) score++;
        if (index === questions.length - 1 && score === questions.length) awardQuizBadge(system);
        render(); body.children[body.children.length - 2].focus({ preventScroll: true });
      }
    }, { signal });
    body.append(progress, fieldset, feedback, action);
    if (moveFocus) { body.scrollTop = 0; progress.focus({ preventScroll: true }); }
  }
  render();
  return { root, setLanguage(next) { language = next; render(); } };
}
