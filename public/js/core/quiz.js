import { element, button } from './dom.js';
import { quizzes } from './quiz-data.js';
import { awardQuizBadge } from './quiz-badges.js';

const copy = {
  en: {
    title: 'Check your understanding', intro: 'Try four questions whenever you like. You can close this quiz and return to it.',
    progress: (n, total) => `Question ${n} of ${total}`, check: 'Check answer', next: 'Next question', finish: 'See results',
    correct: 'Correct.', incorrect: 'Not quite.', retry: 'Try again', result: (score, total) => `You answered ${score} of ${total} correctly.`,
    done: 'Keep exploring the simulation, then try again whenever you like.',
    close: 'Close quiz', move: 'Move quiz window. Drag or use the arrow keys.', earned: '★ Star earned! Find it on this simulation’s card in the collection.',
  },
  he: {
    title: 'בודקים את ההבנה', intro: 'ארבע שאלות שאפשר לפתור בכל רגע. אפשר לסגור את הבוחן ולחזור אליו.',
    progress: (n, total) => `שאלה ${n} מתוך ${total}`, check: 'בדיקת תשובה', next: 'השאלה הבאה', finish: 'הצגת התוצאה',
    correct: 'נכון.', incorrect: 'לא בדיוק.', retry: 'ניסיון נוסף', result: (score, total) => `ענית נכון על ${score} מתוך ${total} שאלות.`,
    done: 'אפשר להמשיך לחקור את ההדמיה ולנסות שוב בכל רגע.',
    close: 'סגירת הבוחן', move: 'הזזת חלון הבוחן. אפשר לגרור או להשתמש במקשי החצים.', earned: '★ זכית בכוכב! הוא יופיע בכרטיס הניסוי באוסף.',
  },
};

export function createQuiz({ system, lang, signal }) {
  const questions = quizzes[system];
  let language = lang, index = 0, selected = null, checked = false, score = 0;
  const root = element('div', 'system-quiz');
  const launcher = button('', 'button secondary quiz-launcher');
  const window = element('section', 'quiz-window'); window.hidden = true; window.id = `${system}-quiz-window`;
  window.setAttribute('role', 'dialog'); window.setAttribute('aria-modal', 'false');
  const header = element('div', 'quiz-window-header');
  const title = element('h2'); title.id = `${system}-quiz-title`; title.setAttribute('tabindex', '0');
  window.setAttribute('aria-labelledby', title.id);
  const close = button('×', 'quiz-close');
  header.append(title, close);
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
  let drag = null;
  function move(left, top) {
    const bounds = window.getBoundingClientRect();
    window.style.left = `${Math.max(0, Math.min(left, globalThis.innerWidth - bounds.width))}px`;
    window.style.top = `${Math.max(0, Math.min(top, globalThis.innerHeight - bounds.height))}px`;
    window.style.right = 'auto'; window.style.bottom = 'auto';
  }
  title.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const bounds = window.getBoundingClientRect();
    drag = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    title.setPointerCapture(event.pointerId); event.preventDefault();
  }, { signal });
  title.addEventListener('pointermove', event => { if (drag) move(event.clientX - drag.x, event.clientY - drag.y); }, { signal });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) title.addEventListener(type, () => { drag = null; }, { signal });
  title.addEventListener('keydown', event => {
    const delta = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }[event.key];
    if (!delta) return;
    event.preventDefault(); const bounds = window.getBoundingClientRect(); move(bounds.left + delta[0], bounds.top + delta[1]);
  }, { signal });
  globalThis.addEventListener?.('resize', () => {
    if (!window.hidden && window.style.left) { const bounds = window.getBoundingClientRect(); move(bounds.left, bounds.top); }
  }, { signal });
  function render(moveFocus = false) {
    const t = copy[language]; launcher.textContent = t.title; title.textContent = t.title;
    title.setAttribute('aria-label', `${t.title}. ${t.move}`); close.setAttribute('aria-label', t.close);
    body.replaceChildren();
    if (index === questions.length) {
      const result = element('h3', 'quiz-result', t.result(score, questions.length));
      result.setAttribute('tabindex', '-1');
      const retry = button(t.retry, 'button secondary');
      retry.addEventListener('click', () => { index = 0; selected = null; checked = false; score = 0; render(true); }, { signal });
      body.append(result, element('p', 'quiz-intro', t.done), retry);
      if (score === questions.length) body.insertBefore(element('p', 'quiz-earned', t.earned), retry);
      if (moveFocus) result.focus();
      return;
    }
    const question = questions[index];
    const progress = element('p', 'quiz-progress', t.progress(index + 1, questions.length));
    progress.setAttribute('tabindex', '-1');
    const fieldset = element('fieldset', 'quiz-options');
    const legend = element('legend', '', question.prompt[language]); fieldset.append(legend);
    const feedback = element('p', 'quiz-feedback'); feedback.setAttribute('role', 'status');
    feedback.setAttribute('tabindex', '-1');
    feedback.hidden = !checked;
    if (checked) feedback.textContent = `${selected === question.correct ? t.correct : t.incorrect} ${question.explanation[language]}`;
    const action = button(checked ? index === questions.length - 1 ? t.finish : t.next : t.check, 'button primary');
    action.disabled = selected === null;
    question.options[language].forEach((option, optionIndex) => {
      const label = element('label', 'quiz-option');
      const input = element('input'); input.type = 'radio'; input.name = `${system}-quiz-${index}`;
      input.value = String(optionIndex); input.checked = selected === optionIndex; input.disabled = checked;
      input.addEventListener('change', () => { selected = optionIndex; action.disabled = false; }, { signal });
      if (checked && optionIndex === question.correct) label.className += ' is-correct';
      else if (checked && optionIndex === selected) label.className += ' is-incorrect';
      label.append(input, element('span', '', option)); fieldset.append(label);
    });
    action.addEventListener('click', () => {
      if (selected === null) return;
      if (checked) { index++; selected = null; checked = false; render(true); }
      else {
        checked = true; if (selected === question.correct) score++;
        if (index === questions.length - 1 && score === questions.length) awardQuizBadge(system);
        render(); body.children[body.children.length - 2].focus();
      }
    }, { signal });
    body.append(element('p', 'quiz-intro', t.intro), progress, fieldset, feedback, action);
    if (moveFocus) progress.focus();
  }
  render();
  return { root, setLanguage(next) { language = next; render(); } };
}
