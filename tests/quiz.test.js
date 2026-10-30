import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { browserFixture } from './dom-fixture.js';
import { demonstrations } from '../public/js/registry.js';
import { quizzes } from '../public/js/core/quiz-data.js';
import { hasQuizBadge, awardQuizBadge, createQuizBadge } from '../public/js/core/quiz-badges.js';
setMaxListeners(0);
const hasClass = name => node => node.className.split(' ').includes(name);
const descendants = node => [node, ...node.children.flatMap(descendants)];

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
        assert.match(feedback.textContent, index % 2 ? /^Not quite\./ : /^Correct\./);
        assert.ok(feedback.textContent.includes(question.explanation.en));
        demo.setLanguage('he');
        feedback = nodes().find(hasClass('quiz-feedback'));
        assert.ok(feedback.textContent.includes(question.explanation.he));
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
