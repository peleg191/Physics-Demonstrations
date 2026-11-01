import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { browserFixture } from './dom-fixture.js';
import { demonstrations } from '../public/js/registry.js';
import { createQuiz } from '../public/js/core/quiz.js';
import { quizzes } from '../public/js/core/quiz-data.js';
import { hasQuizBadge, awardQuizBadge, createQuizBadge } from '../public/js/core/quiz-badges.js';
setMaxListeners(0);
const hasClass = name => node => node.className.split(' ').includes(name);
const descendants = node => [node, ...node.children.flatMap(descendants)];
const readableText = node => node.tagName === 'math' ? node.getAttribute('aria-label') : node.children.length ? node.children.map(readableText).join('') : node.textContent;
const plainCopy = text => text.replaceAll('$', '');

for (const entry of demonstrations) {
  test(`${entry.id}: quiz grading, language changes, parameter edits and retry`, async () => {
    const fixture = browserFixture(); let demo;
    try {
      demo = (await entry.load()).mount({ root: fixture.root, lang: 'en' });
      const root = fixture.find(hasClass('system-quiz'));
      const window = descendants(root).find(hasClass('quiz-window'));
      const launcher = descendants(root).find(hasClass('quiz-launcher'));
      const close = descendants(root).find(hasClass('quiz-close'));
      assert.equal(window.hidden, true);
      assert.equal(launcher.children[0].tagName, 'svg');
      assert.doesNotMatch(root.textContent, /Try four questions whenever you like/);
      launcher.dispatchEvent(new Event('click'));
      assert.equal(window.hidden, false);
      assert.equal(window.getAttribute('aria-modal'), 'false');
      assert.equal(launcher.getAttribute('aria-expanded'), 'true');
      const body = descendants(root).find(hasClass('quiz-body'));
      const questions = quizzes[entry.id];
      const nodes = () => descendants(body);
      const action = () => nodes().find(node => node.tagName === 'button');
      const choices = () => nodes().filter(node => node.type === 'radio');
      const choose = index => { const radio = choices()[index]; radio.checked = true; radio.dispatchEvent(new Event('change')); };
      assert.equal(action().disabled, true);
      for (let index = 0; index < questions.length; index++) {
        const question = questions[index];
        for (const language of ['en', 'he']) {
          assert.ok(question.prompt[language]);
          assert.ok(question.explanation[language]);
          assert.equal(question.options[language].length, 3);
        }
        assert.ok(Number.isInteger(question.correct) && question.correct >= 0 && question.correct < 3);
        const answer = index % 2 ? (question.correct + 1) % 3 : question.correct;
        choose(answer); assert.equal(action().disabled, false);
        if (index === 0) {
          close.dispatchEvent(new Event('click'));
          assert.equal(window.hidden, true);
          assert.equal(fixture.document.activeElement, launcher);
          launcher.dispatchEvent(new Event('click'));
          assert.equal(window.hidden, false);
          const parameter = fixture.find(node => node.type === 'number');
          parameter.dispatchEvent(new Event('change'));
          assert.equal(choices()[answer].checked, true);
        }
        action().dispatchEvent(new Event('click'));
        assert.ok(choices().every(node => node.disabled));
        let feedback = nodes().find(hasClass('quiz-feedback'));
        assert.match(readableText(feedback), index % 2 ? /^Not quite\./ : /^Correct\./);
        assert.ok(readableText(feedback).includes(plainCopy(question.explanation.en)));
        demo.setLanguage('he');
        assert.equal(launcher.children[0].tagName, 'svg');
        assert.match(launcher.textContent, /בודקים את ההבנה/);
        feedback = nodes().find(hasClass('quiz-feedback'));
        assert.ok(readableText(feedback).includes(plainCopy(question.explanation.he)));
        assert.equal(choices()[answer].checked, true);
        demo.setLanguage('en');
        action().dispatchEvent(new Event('click'));
      }
      assert.match(root.textContent, /2 of 4 correctly/);
      assert.equal(hasQuizBadge(entry.id), false);
      action().dispatchEvent(new Event('click'));
      assert.equal(action().disabled, true);
      assert.ok(choices().every(node => !node.checked && !node.disabled));
      for (const question of questions) {
        choose(question.correct);
        action().dispatchEvent(new Event('click'));
        action().dispatchEvent(new Event('click'));
      }
      assert.match(root.textContent, /4 of 4 correctly/);
      assert.equal(hasQuizBadge(entry.id), true);
      assert.ok(nodes().find(hasClass('quiz-earned')));
      const badge = createQuizBadge(entry.id, 'en');
      assert.equal(badge.children[0].tagName, 'svg');
      assert.match(badge.getAttribute('aria-label'), /all answers correct/);
      action().dispatchEvent(new Event('click'));
      assert.equal(hasQuizBadge(entry.id), true, 'retry keeps an earned badge');
      const escape = new Event('keydown', { cancelable: true }); Object.defineProperty(escape, 'key', { value: 'Escape' });
      window.dispatchEvent(escape); assert.equal(window.hidden, true);
      assert.equal(fixture.frames.size, 0, 'quizzes do not start simulation playback');
      launcher.dispatchEvent(new Event('click'));
      const play = fixture.find(node => node.tagName === 'button' && node.textContent === 'Play');
      play.dispatchEvent(new Event('click'));
      fixture.frame(0); fixture.frame(100);
      assert.equal(window.hidden, false);
      assert.equal(fixture.frames.size, 1, 'simulation runs while the quiz is open');
      close.dispatchEvent(new Event('click'));
      assert.equal(fixture.frames.size, 1, 'closing the quiz does not pause playback');
      demo.dispose(); demo = null;
      assert.equal(fixture.root.children.length, 0);
    } finally { demo?.dispose(); fixture.cleanup(); }
  });
}

test('badge storage survives a new card render and handles unavailable storage', () => {
  const fixture = browserFixture(); const originalStorage = globalThis.localStorage;
  const saved = new Map();
  globalThis.localStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
  try {
    assert.equal(createQuizBadge('unearned', 'en'), null);
    awardQuizBadge('stored-test');
    assert.equal(saved.get('physics-quiz-badge-v1-stored-test'), '1');
    saved.set('physics-quiz-badge-v1-previous-session', '1');
    assert.equal(hasQuizBadge('previous-session'), true);
    assert.match(createQuizBadge('previous-session', 'he').getAttribute('aria-label'), /נכונות/);
    globalThis.localStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
    awardQuizBadge('blocked-test'); assert.equal(hasQuizBadge('blocked-test'), true);
    assert.equal(hasQuizBadge('unknown-test'), false);
  } finally {
    if (originalStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = originalStorage;
    fixture.cleanup();
  }
});


test('mobile quiz keeps its fixed layout and starts new questions at the top', () => {
  const fixture = browserFixture();
  globalThis.matchMedia = () => ({ matches: true });
  const controller = new AbortController();
  try {
    const quiz = createQuiz({ system: demonstrations[0].id, lang: 'en', signal: controller.signal });
    fixture.root.append(quiz.root);
    const title = fixture.find(node => node.tagName === 'h2');
    assert.equal(title.getAttribute('aria-label'), title.textContent);
    const pointer = new Event('pointerdown', { cancelable: true });
    Object.defineProperty(pointer, 'button', { value: 0 });
    title.dispatchEvent(pointer);
    assert.equal(pointer.defaultPrevented, false);
    const arrow = new Event('keydown', { cancelable: true });
    Object.defineProperty(arrow, 'key', { value: 'ArrowDown' });
    title.dispatchEvent(arrow);
    assert.equal(arrow.defaultPrevented, false);
    const body = fixture.find(hasClass('quiz-body'));
    const action = () => descendants(body).find(node => node.tagName === 'button');
    fixture.find(node => node.type === 'radio').dispatchEvent(new Event('change'));
    action().dispatchEvent(new Event('click'));
    assert.ok(hasClass('is-checked')(body));
    assert.equal(action().disabled, false);
    body.scrollTop = 300;
    action().dispatchEvent(new Event('click'));
    assert.equal(body.scrollTop, 0);
    assert.equal(hasClass('is-checked')(body), false);
    assert.equal(fixture.document.activeElement, fixture.find(hasClass('quiz-progress')));
  } finally { controller.abort(); fixture.cleanup(); }
});

test('quiz mathematics uses inline MathML in Hebrew answers and feedback', () => {
  const fixture = browserFixture(), controller = new AbortController();
  try {
    const quiz = createQuiz({ system: 'incline', lang: 'he', signal: controller.signal });
    fixture.root.append(quiz.root);
    const nodes = () => descendants(quiz.root);
    const math = () => nodes().filter(node => node.tagName === 'math');
    const action = () => nodes().find(node => node.tagName === 'button' && hasClass('primary')(node));
    const choose = index => nodes().filter(node => node.type === 'radio')[index].dispatchEvent(new Event('change'));
    assert.deepEqual(math().map(node => node.getAttribute('aria-label')), ['mg cos θ', 'mg', 'mg sin θ']);
    assert.ok(nodes().some(node => node.tagName === 'mi' && node.textContent === 'sin'));
    choose(0);
    assert.equal(nodes().filter(hasClass('is-selected')).length, 1);
    action().dispatchEvent(new Event('click'));
    const feedback = nodes().find(hasClass('quiz-feedback'));
    assert.equal(hasClass('is-incorrect')(feedback), true);
    assert.ok(descendants(feedback).some(node => node.tagName === 'math'));
    action().dispatchEvent(new Event('click'));
    assert.ok(nodes().some(node => node.tagName === 'msub'));
    for (const expression of math()) {
      assert.equal(expression.getAttribute('display'), 'inline');
      assert.equal(expression.getAttribute('dir'), 'ltr');
      assert.equal(expression.getAttribute('class'), 'quiz-math');
    }
    const progress = nodes().find(node => node.tagName === 'progress');
    assert.equal(progress.value, 2); assert.equal(progress.max, 4);
    assert.doesNotMatch(quiz.root.textContent, /\$/);
    quiz.setLanguage('en');
    assert.ok(nodes().some(node => node.tagName === 'msub'));
    assert.doesNotMatch(quiz.root.textContent, /\$/);
  } finally { controller.abort(); fixture.cleanup(); }
});
