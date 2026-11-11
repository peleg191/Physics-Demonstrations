import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { browserFixture } from './dom-fixture.js';
import { demonstrations } from '../public/js/registry.js';
import { createQuiz } from '../public/js/core/quiz.js';
import { readQuizProgress, quizMilestones } from '../public/js/core/quiz-progress.js';
import { quizzes } from '../public/js/core/quiz-data.js';
import { hasQuizBadge, awardQuizBadge, createQuizBadge } from '../public/js/core/quiz-badges.js';
setMaxListeners(0);
const hasClass = name => node => node.className.split(' ').includes(name);
const descendants = node => [node, ...node.children.flatMap(descendants)];
const readableText = node => node.tagName === 'math' ? node.getAttribute('aria-label') : node.children.length ? node.children.map(readableText).join('') : node.textContent;
const plainCopy = text => text.replaceAll('$', '');

for (const entry of demonstrations) {
  test(`${entry.id}: five-question intuition session, feedback, retries, localization and Explorer`, async () => {
    const fixture = browserFixture(); let demo;
    try {
      demo = (await entry.load()).mount({ root: fixture.root, lang: 'en' });
      const root = fixture.find(hasClass('system-quiz'));
      const window = descendants(root).find(hasClass('quiz-window'));
      const launcher = descendants(root).find(hasClass('quiz-launcher'));
      const close = descendants(root).find(hasClass('quiz-close'));
      const body = descendants(root).find(hasClass('quiz-body'));
      const nodes = () => descendants(body);
      const action = () => nodes().find(hasClass('quiz-action'));
      const choices = () => nodes().filter(node => node.type === 'radio');
      const choose = index => { choices()[index].checked = true; choices()[index].dispatchEvent(new Event('change')); };
      assert.equal(window.hidden, true); launcher.dispatchEvent(new Event('click'));
      assert.equal(window.getAttribute('aria-modal'), 'false');
      assert.equal(action().disabled, true);
      const ids = [];
      for (let index = 0; index < 5; index++) {
        const question = quizzes[entry.id].find(question => choices()[0].name === `${entry.id}-quiz-${question.id}`);
        ids.push(question.id);
        // Experiment challenges remain optional in ordinary question sets.
        nodes().find(hasClass('quiz-skip'))?.dispatchEvent(new Event('click'));
        const answer = index % 2 ? (question.correct + 1) % 3 : question.correct;
        choose(answer);
        if (index === 0) {
          close.dispatchEvent(new Event('click')); assert.equal(window.hidden, true);
          assert.equal(fixture.document.activeElement, launcher); launcher.dispatchEvent(new Event('click'));
          fixture.find(node => node.type === 'number').dispatchEvent(new Event('change'));
          assert.equal(choices()[answer].checked, true);
        }
        action().dispatchEvent(new Event('click'));
        assert.ok(choices().every(node => node.disabled));
        const feedback = nodes().find(hasClass('quiz-feedback'));
        assert.match(readableText(feedback), index % 2 ? /^Not quite\./ : /^Correct\./);
        assert.equal(fixture.document.activeElement, feedback);
        if (index % 2) assert.ok(nodes().some(hasClass('quiz-reveal')));
        demo.setLanguage('he'); assert.match(launcher.textContent, /בודקים את ההבנה/);
        assert.equal(choices()[answer].checked, true); demo.setLanguage('en');
        if (index % 2) {
          assert.equal(nodes().filter(hasClass('is-correct')).length, 0, 'wrong feedback must not reveal the correct option');
          action().dispatchEvent(new Event('click'));
          choose(question.correct); action().dispatchEvent(new Event('click'));
          assert.match(readableText(nodes().find(hasClass('quiz-feedback'))), /^Correct\./);
        }
        action().dispatchEvent(new Event('click'));
      }
      assert.equal(new Set(ids).size, 5);
      assert.match(body.textContent, /3 of 5.*first attempt/);
      assert.equal(quizMilestones(entry.id, quizzes[entry.id]).explorer, true);
      assert.equal(quizMilestones(entry.id, quizzes[entry.id]).mastery, false);
      assert.equal(fixture.frames.size, 0);
      const next = nodes().find(node => node.tagName === 'button' && node.textContent === 'Start next set');
      next.dispatchEvent(new Event('click')); assert.equal(action().disabled, true);
      const nextIds = readQuizProgress(entry.id).active.ids;
      assert.ok(nextIds.some(id => !ids.includes(id)), 'next set must include unseen questions');
      const escape = new Event('keydown', { cancelable: true }); Object.defineProperty(escape, 'key', { value: 'Escape' });
      window.dispatchEvent(escape); assert.equal(window.hidden, true);
      launcher.dispatchEvent(new Event('click'));
      fixture.find(node => node.tagName === 'button' && node.textContent === 'Play').dispatchEvent(new Event('click'));
      close.dispatchEvent(new Event('click')); assert.equal(fixture.frames.size, 1);
      demo.dispose(); demo = null; assert.equal(fixture.root.children.length, 0);
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
    const quiz = createQuiz({ system: demonstrations[0].id, lang: 'en', signal: controller.signal, initialMode: 'practice' });
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
    const action = () => descendants(body).find(hasClass('quiz-action'));
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
    const quiz = createQuiz({ system: 'incline', lang: 'he', signal: controller.signal, initialMode: 'practice' });
    fixture.root.append(quiz.root);
    const nodes = () => descendants(quiz.root);
    const math = () => nodes().filter(node => node.tagName === 'math');
    const action = () => nodes().find(node => node.tagName === 'button' && hasClass('primary')(node));
    const choose = index => nodes().filter(node => node.type === 'radio')[index].dispatchEvent(new Event('change'));
    assert.deepEqual(math().map(node => node.getAttribute('aria-label')), [String.raw`mg \cos \theta`, 'mg', String.raw`mg \sin \theta`]);
    assert.ok(nodes().some(node => node.tagName === 'mi' && node.textContent === 'sin'));
    choose(0);
    assert.equal(nodes().filter(hasClass('is-selected')).length, 1);
    action().dispatchEvent(new Event('click'));
    const feedback = nodes().find(hasClass('quiz-feedback'));
    assert.equal(hasClass('is-incorrect')(feedback), true);
    assert.ok(readableText(feedback).length > 20);
    nodes().find(hasClass('quiz-reveal')).dispatchEvent(new Event('click'));
    action().dispatchEvent(new Event('click'));
    assert.ok(nodes().some(node => node.tagName === 'msub'));
    for (const expression of math()) {
      assert.equal(expression.getAttribute('display'), 'inline');
      assert.equal(expression.getAttribute('dir'), 'ltr');
      assert.equal(expression.getAttribute('class'), 'quiz-math');
    }
    const progress = nodes().find(node => node.tagName === 'progress');
    assert.equal(progress.value, 2); assert.equal(progress.max, 10);
    assert.doesNotMatch(quiz.root.textContent, /\$/);
    quiz.setLanguage('en');
    assert.ok(nodes().some(node => node.tagName === 'msub'));
    assert.doesNotMatch(quiz.root.textContent, /\$/);
  } finally { controller.abort(); fixture.cleanup(); }
});


for (const [system, questionIndex, structures] of [
  ['rotating-tube', 2, ['msub', 'msqrt', 'mfrac', 'msup']],
  ['two-string', 0, ['msqrt', 'mfrac', 'msup']],
  ['energy-bowl', 3, ['msup', 'mfrac']],
  ['double-spring', 2, ['msqrt', 'mfrac']],
  ['carousel', 2, ['msqrt', 'msup']],
]) {
  for (const language of ['en', 'he']) {
    test(`${system}: question ${questionIndex + 1} renders typeset equations in ${language}`, () => {
      const fixture = browserFixture(), controller = new AbortController();
      try {
        const quiz = createQuiz({ system, lang: language, signal: controller.signal, initialMode: 'practice' }); fixture.root.append(quiz.root);
        const nodes = () => descendants(quiz.root);
        const action = () => nodes().find(node => node.tagName === 'button' && hasClass('primary')(node));
        for (let index = 0; index <= questionIndex; index++) {
          const choices = nodes().filter(node => node.type === 'radio');
          choices[quizzes[system][index].correct].dispatchEvent(new Event('change'));
          action().dispatchEvent(new Event('click'));
          if (index < questionIndex) action().dispatchEvent(new Event('click'));
        }
        for (const tag of structures) assert.ok(nodes().some(node => node.tagName === tag), `missing ${tag}`);
        for (const math of nodes().filter(node => node.tagName === 'math')) {
          assert.equal(math.getAttribute('dir'), 'ltr'); assert.equal(math.getAttribute('display'), 'inline');
          assert.doesNotMatch(math.textContent, /[\\$]/, 'LaTeX commands must not leak into visible text');
        }
        const outsideMath = node => node.tagName === 'math' ? '' : node.children.length ? node.children.map(outsideMath).join('') : node.textContent;
        assert.doesNotMatch(outsideMath(quiz.root), /[=√²ₛωαθℓπ$\\]/, 'equations must not remain in prose');
      } finally { controller.abort(); fixture.cleanup(); }
    });
  }
}

test('quiz data marks mathematical expressions in prompts, options and explanations in both languages', () => {
  for (const [system, questions] of Object.entries(quizzes)) for (const question of questions) for (const language of ['en', 'he']) {
    for (const text of [question.prompt[language], ...question.options[language], question.explanation[language]]) {
      assert.equal((text.match(/\$/g) || []).length % 2, 0, `${system}: unmatched math delimiter`);
      assert.doesNotMatch(text.replace(/\$[^$]+\$/g, ''), /[=√²ₛωαθℓπ]/, `${system}: unformatted mathematics`);
    }
  }
});

test('tube quiz keeps its question and score if feedback rendering fails, then recovers on retry', () => {
  const fixture = browserFixture(), controller = new AbortController(), clicks = new WeakMap();
  const question = quizzes['rotating-tube'][0], originalExplanation = question.explanation.en;
  const createElement = fixture.document.createElement;
  fixture.document.createElement = tag => {
    const node = createElement(tag), listen = node.addEventListener.bind(node);
    node.addEventListener = (type, callback, options) => {
      if (tag === 'button' && type === 'click') clicks.set(node, callback);
      listen(type, callback, options);
    };
    return node;
  };
  try {
    const quiz = createQuiz({ system: 'rotating-tube', lang: 'en', signal: controller.signal, initialMode: 'practice' }); fixture.root.append(quiz.root);
    const body = fixture.find(hasClass('quiz-body'));
    const action = () => descendants(body).find(hasClass('quiz-action'));
    const choose = index => descendants(body).filter(node => node.type === 'radio')[index].dispatchEvent(new Event('change'));
    choose(question.correct);
    const children = [...body.children], submit = clicks.get(action());
    question.explanation.en = String.raw`Unsupported feedback $\unsupported{omega}$`;
    assert.throws(() => submit(), /Unsupported authored LaTeX command/);
    assert.equal(body.children.length, children.length, 'the current question must remain visible');
    children.forEach((node, index) => assert.equal(body.children[index], node));
    assert.equal(hasClass('is-checked')(body), false);
    question.explanation.en = originalExplanation;
    submit();
    assert.match(readableText(body), /Correct\./);
    assert.ok(descendants(body).some(node => node.tagName === 'mi' && node.textContent === 'ω'));
    action().dispatchEvent(new Event('click'));
    for (const remaining of quizzes['rotating-tube'].slice(1)) {
      choose(remaining.correct); action().dispatchEvent(new Event('click')); action().dispatchEvent(new Event('click'));
    }
    assert.match(body.textContent, /10 of 10.*first attempt/, 'a failed render must not count the answer twice');
  } finally { question.explanation.en = originalExplanation; controller.abort(); fixture.cleanup(); }
});


test('tube quiz loads the new math renderer even when an older renderer is already cached', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'quiz-math-cache-'));
  const fixture = browserFixture(), controller = new AbortController();
  try {
    await cp(new URL('../public/js/', import.meta.url), directory, { recursive: true });
    await writeFile(join(directory, 'package.json'), '{"type":"module"}');
    const rendererPath = join(directory, 'core/latex.js'), currentSource = await readFile(rendererPath, 'utf8');
    await writeFile(rendererPath, currentSource.replace("omega: 'ω', pi: 'π', ell: 'ℓ', ", ''));
    const older = await import(pathToFileURL(rendererPath).href);
    assert.throws(() => older.latexExpression(String.raw`m\omega^2r`), /Unsupported authored LaTeX command: omega/);
    await writeFile(rendererPath, currentSource);
    const fresh = await import(pathToFileURL(join(directory, 'core/quiz.js')).href);
    const quiz = fresh.createQuiz({ system: 'rotating-tube', lang: 'en', signal: controller.signal, initialMode: 'practice' }); fixture.root.append(quiz.root);
    const body = fixture.find(hasClass('quiz-body'));
    const radio = descendants(body).find(node => node.type === 'radio'); radio.dispatchEvent(new Event('change'));
    descendants(body).find(hasClass('quiz-action')).dispatchEvent(new Event('click'));
    assert.ok(descendants(body).some(hasClass('quiz-feedback')));
    assert.match(readableText(body), /Correct\./);
    assert.ok(descendants(body).some(node => node.tagName === 'mi' && node.textContent === 'ω'));
  } finally { controller.abort(); fixture.cleanup(); await rm(directory, { recursive: true, force: true }); }
});
