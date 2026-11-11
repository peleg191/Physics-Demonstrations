import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { browserFixture } from './dom-fixture.js';
import { quizzes } from '../public/js/core/quiz-data.js';
import { intuitionQuestions } from '../public/js/core/quiz-intuition.js';
import { demonstrations } from '../public/js/registry.js';
import { createQuiz } from '../public/js/core/quiz.js';
import { createAchievements, createAchievementSummary, decorateAchievementCard } from '../public/js/core/quiz-achievements.js';
import { recordQuizAnswer, readQuizProgress, saveQuizProgress, selectQuizQuestions, quizMilestones } from '../public/js/core/quiz-progress.js';
setMaxListeners(0);
const descendants = node => [node, ...node.children.flatMap(descendants)];
const hasClass = name => node => node.className.split(' ').includes(name);
const find = (root, name) => descendants(root).find(hasClass(name));
const click = node => { assert.ok(node); assert.equal(node.disabled, false); node.dispatchEvent(new Event('click')); };

for (const entry of demonstrations) {
  test(`${entry.id}: ten distinct bilingual questions and valid observable experiment presets`, () => {
    const bank = quizzes[entry.id];
    assert.equal(bank.length, 10); assert.equal(intuitionQuestions[entry.id].length, 6);
    assert.equal(new Set(bank.map(q => q.id)).size, 10);
    for (const lang of ['en', 'he']) {
      assert.equal(new Set(bank.map(q => q.prompt[lang])).size, 10);
      for (const question of bank) {
        assert.equal(question.options[lang].length, 3);
        assert.ok(question.prompt[lang] && question.explanation[lang]);
        assert.ok(question.correct >= 0 && question.correct < 3);
        if (question.feedback) assert.equal(question.feedback[lang].length, 3);
        for (const run of question.experiment?.runs ?? []) assert.ok(run.label[lang]);
      }
    }
    for (const question of bank) assert.ok(bank.some(other => other.id !== question.id && other.topic === question.topic), 'each concept needs an independent review question');
    assert.equal(bank.filter(question => question.experiment).length, 2);
  });
  test(`${entry.id}: all experiment buttons apply their advertised values and advance simulation time`, async () => {
    const fixture = browserFixture(); let demo;
    try {
      demo = (await entry.load()).mount({ root: fixture.root, lang: 'en' });
      const quiz = fixture.find(hasClass('system-quiz'));
      click(descendants(quiz).find(node => node.tagName === 'button' && node.textContent === 'Experiment challenges'));
      const bank = quizzes[entry.id], experiments = bank.filter(question => question.experiment);
      const body = find(quiz, 'quiz-body');
      const action = () => find(body, 'quiz-action');
      const choose = index => descendants(body).filter(node => node.type === 'radio')[index].dispatchEvent(new Event('change'));
      for (const question of experiments) {
        assert.ok(descendants(body).filter(hasClass('quiz-run')).every(node => node.disabled));
        choose(question.correct); click(find(body, 'challenge-value'));
        assert.equal(fixture.frames.size, 1, 'value card must launch baseline directly');
        assert.equal(find(quiz, 'quiz-window').hidden, false, 'launching from the value card keeps the quiz open');
        assert.equal(fixture.find(hasClass('experiment-coach')).parentNode, find(quiz, 'quiz-window'));
        assert.equal(action().disabled, true, 'explaining requires observing both setups');
        for (let index = 0; index < 2; index++) {
          if (index === 1) click(descendants(fixture.root).filter(hasClass('quiz-run'))[index]);
          assert.equal(fixture.frames.size, 1, 'experiment click must start playback');
          for (const [key, value] of Object.entries(question.experiment.runs[index].values)) {
            const input = fixture.find(node => node.id === `${entry.id}-${key}`);
            assert.equal(Number(input.value), value, `${entry.id}: ${key} must match the authored preset`);
          }
          fixture.frame(0); fixture.frame(100000);
          const observed = readQuizProgress(entry.id).active.current.observed;
          assert.equal(observed[index], true, `${entry.id}: setup ${index} must actually advance time`);
          if (index === 0) assert.equal(action().disabled, true);
        }
        click(fixture.find(hasClass('coach-next')));
        choose(question.experiment.reasoning.correct); click(action()); click(action());
      }
      assert.equal(quizMilestones(entry.id, bank).investigations, experiments.length);
      assert.equal(quizMilestones(entry.id, bank).investigator, false, 'Explorer is also required');
    } finally { demo?.dispose(); fixture.cleanup(); }
  });
}

test('selection covers unseen questions, balances concepts, and prioritizes an independent review', () => {
  const fixture = browserFixture();
  try {
    const bank = quizzes.spring, first = selectQuizQuestions('spring', bank);
    assert.equal(first.length, 5); assert.equal(new Set(first.map(q => q.id)).size, 5);
    first.forEach(question => recordQuizAnswer('spring', question, { correct: true }));
    const second = selectQuizQuestions('spring', bank);
    assert.equal(second.filter(question => !first.includes(question)).length, 5);
    recordQuizAnswer('spring', bank[0], { correct: false });
    assert.ok(selectQuizQuestions('spring', bank).some(q => q.id !== bank[0].id && q.topic === bank[0].topic));
  } finally { fixture.cleanup(); }
});

test('unseen questions precede review and repeated topics in next sets', () => {
  const fixture = browserFixture();
  try {
    const bank = [
      { id: 'seen-review', topic: 'review' },
      { id: 'unseen-a', topic: 'new' },
      { id: 'unseen-b', topic: 'new' },
      { id: 'missed', topic: 'review' },
    ];
    recordQuizAnswer('selection-test', bank[0], { correct: true });
    recordQuizAnswer('selection-test', bank[3], { correct: false });
    assert.deepEqual(selectQuizQuestions('selection-test', bank, 2).map(q => q.id), ['unseen-a', 'unseen-b']);
    assert.deepEqual(selectQuizQuestions('selection-test', bank, 4).map(q => q.id), ['unseen-a', 'unseen-b', 'missed']);
  } finally { fixture.cleanup(); }
});

for (const label of ['Start next set', 'Practice all questions']) {
  test(`${label} puts incorrect answers before correctly answered review questions`, () => {
    const fixture = browserFixture(), controller = new AbortController();
    try {
      const bank = quizzes.spring;
      bank.forEach(question => recordQuizAnswer('spring', question, { correct: true }));
      const state = readQuizProgress('spring');
      const missed = bank.at(-1);
      state.answers[missed.id] = { seen: true, attempts: 1, solved: false, clean: false };
      state.review[missed.topic] = missed.id;
      saveQuizProgress('spring', state);
      const quiz = createQuiz({ system: 'spring', lang: 'en', signal: controller.signal });
      fixture.root.append(quiz.root);
      click(descendants(quiz.root).find(node => node.tagName === 'button' && node.textContent === label));
      assert.equal(readQuizProgress('spring').active.ids[0], missed.id);
      assert.equal(find(quiz.root, 'quiz-options').children[0].textContent, missed.prompt.en);
    } finally { controller.abort(); fixture.cleanup(); }
  });

  test(`${label} exhausts unanswered questions before any submitted answer`, () => {
    const fixture = browserFixture(), controller = new AbortController();
    try {
      const bank = quizzes.spring, state = readQuizProgress('spring');
      for (const question of bank.slice(0, 8)) {
        state.answers[question.id] = { seen: true, attempts: 1, solved: true, clean: true };
      }
      // A stored seen marker without a submitted answer must remain unanswered.
      state.answers[bank[8].id] = { seen: true, attempts: 0, solved: false, clean: false };
      saveQuizProgress('spring', state);
      const quiz = createQuiz({ system: 'spring', lang: 'en', signal: controller.signal });
      fixture.root.append(quiz.root);
      click(descendants(quiz.root).find(node => node.tagName === 'button' && node.textContent === label));
      const ids = readQuizProgress('spring').active.ids;
      assert.deepEqual(ids.slice(0, 2), bank.slice(8).map(q => q.id));
      for (const question of bank.slice(8)) {
        assert.equal(find(quiz.root, 'quiz-options').children[0].textContent, question.prompt.en);
        descendants(quiz.root).filter(node => node.type === 'radio')[question.correct].dispatchEvent(new Event('change'));
        click(find(quiz.root, 'quiz-action'));
        click(find(quiz.root, 'quiz-action'));
      }
    } finally { controller.abort(); fixture.cleanup(); }
  });

  test(`${label} puts unanswered questions first after partial progress`, () => {
    const fixture = browserFixture(), controller = new AbortController();
    try {
      const bank = quizzes.spring;
      const quiz = createQuiz({ system: 'spring', lang: 'en', signal: controller.signal });
      fixture.root.append(quiz.root);
      const first = selectQuizQuestions('spring', bank)[0].id;
      const question = bank.find(q => q.id === first);
      descendants(quiz.root).filter(node => node.type === 'radio')[question.correct].dispatchEvent(new Event('change'));
      click(find(quiz.root, 'quiz-action'));
      click(descendants(quiz.root).find(node => node.tagName === 'button' && node.textContent === label));
      const state = readQuizProgress('spring');
      const ids = state.active.ids;
      assert.ok(!state.answers[ids[0]]?.seen);
      if (label === 'Practice all questions') {
        assert.equal(ids.length, bank.length);
        assert.equal(new Set(ids).size, bank.length);
        assert.equal(ids.at(-1), first);
        assert.ok(ids.slice(0, -1).every(id => !state.answers[id]?.seen));
      } else {
        assert.equal(ids.length, 5);
        assert.ok(ids.every(id => !state.answers[id]?.seen));
      }
    } finally { controller.abort(); fixture.cleanup(); }
  });
}

test('milestones require observation and independent concept review; earned milestones never disappear', () => {
  const fixture = browserFixture();
  try {
    const bank = quizzes.spring;
    let state = readQuizProgress('spring'); state.sessions = 1; saveQuizProgress('spring', state);
    bank.forEach(question => recordQuizAnswer('spring', question, { correct: true }));
    assert.equal(quizMilestones('spring', bank).explorer, true);
    assert.equal(quizMilestones('spring', bank).investigator, false);
    const missed = bank[0]; recordQuizAnswer('spring', missed, { correct: false });
    recordQuizAnswer('spring', missed, { correct: true, assisted: true });
    bank.filter(q => q.experiment).forEach(question => recordQuizAnswer('spring', question, { correct: true, investigation: true }));
    assert.equal(quizMilestones('spring', bank).investigator, true);
    assert.equal(quizMilestones('spring', bank).mastery, false);
    recordQuizAnswer('spring', missed, { correct: true });
    assert.equal(quizMilestones('spring', bank).mastery, false, 'repeating the revealed question cannot clear review');
    recordQuizAnswer('spring', bank.find(q => q.id !== missed.id && q.topic === missed.topic), { correct: true });
    assert.equal(quizMilestones('spring', bank).mastery, true);
    recordQuizAnswer('spring', missed, { correct: false });
    assert.equal(quizMilestones('spring', bank).mastery, true, 'later practice cannot revoke achievements');
    const view = createAchievements({ lang: 'en', signal: new AbortController().signal });
    assert.match(view.textContent, /1 of 14 demonstrations mastered/);
    view.setLanguage('he'); assert.match(view.textContent, /שליטה ב־1 מתוך 14/);
  } finally { fixture.cleanup(); }
});

test('active answers and hints survive remount and language changes without granting unaided credit', () => {
  const fixture = browserFixture(); let controller = new AbortController();
  try {
    let quiz = createQuiz({ system: 'basketball', lang: 'en', signal: controller.signal }); fixture.root.append(quiz.root);
    const question = quizzes.basketball[0];
    find(quiz.root, 'quiz-hint').dispatchEvent(new Event('click'));
    descendants(quiz.root).filter(node => node.type === 'radio')[question.correct].dispatchEvent(new Event('change'));
    controller.abort(); quiz.root.remove(); controller = new AbortController();
    quiz = createQuiz({ system: 'basketball', lang: 'he', signal: controller.signal }); fixture.root.append(quiz.root);
    assert.equal(descendants(quiz.root).filter(node => node.type === 'radio')[question.correct].checked, true);
    assert.equal(find(quiz.root, 'quiz-feedback').hidden, false);
    click(find(quiz.root, 'quiz-action'));
    assert.equal(readQuizProgress('basketball').answers[question.id].clean, false);
    quiz.setLanguage('en'); assert.match(find(quiz.root, 'quiz-feedback').textContent, /Correct/);
  } finally { controller.abort(); fixture.cleanup(); }
});

test('invalid persisted data cannot break the quiz', () => {
  const fixture = browserFixture(), controller = new AbortController();
  try {
    localStorage.setItem('physics-quiz-progress-v1-spring', JSON.stringify({ answers: null, review: 7, active: { ids: ['deleted-question'], index: 0 } }));
    const quiz = createQuiz({ system: 'spring', lang: 'en', signal: controller.signal }); fixture.root.append(quiz.root);
    assert.match(find(quiz.root, 'quiz-progress').textContent, /Question 1 of 5/);
  } finally { controller.abort(); fixture.cleanup(); }
});

test('write-blocked storage keeps progress for the visit and explains that it is temporary', () => {
  const fixture = browserFixture(), controller = new AbortController();
  const storage = globalThis.localStorage;
  try {
    globalThis.localStorage = { getItem: () => null, setItem: () => { throw Error('quota'); } };
    const question = quizzes.elevator[0];
    recordQuizAnswer('elevator', question, { correct: true });
    assert.equal(readQuizProgress('elevator').answers[question.id].clean, true);
    const view = createAchievements({ lang: 'en', signal: controller.signal });
    assert.match(view.textContent, /Progress lasts for this visit/);
  } finally { globalThis.localStorage = storage; controller.abort(); fixture.cleanup(); }
});

test('collection achievements and the final award can all be earned', () => {
  const fixture = browserFixture(), controller = new AbortController();
  try {
    const view = createAchievements({ lang: 'en', signal: controller.signal });
    for (const entry of demonstrations) {
      const bank = quizzes[entry.id], state = readQuizProgress(entry.id);
      state.sessions = 1;
      state.answers = Object.fromEntries(bank.map(question => [question.id, { seen: true, solved: true, clean: true, attempts: 1 }]));
      state.investigations = bank.filter(question => question.experiment).map(question => question.id);
      saveQuizProgress(entry.id, state);
    }
    assert.match(view.textContent, /14 of 14 demonstrations mastered/);
    const groups = descendants(view).filter(node => node.tagName === 'li' && node.className === 'is-earned');
    assert.ok(groups.some(node => node.textContent.includes('Physics collection complete')));
    assert.equal(groups.filter(node => /Oscillation insight|Friction|Motion and balance|Circular motion|Physics collection complete/.test(node.textContent)).length, 5);
  } finally { controller.abort(); fixture.cleanup(); }
});

test('the full quiz UI can earn Explorer, Investigator, Mastery, and the star', async () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = (await demonstrations.find(entry => entry.id === 'spring').load()).mount({ root: fixture.root, lang: 'en' });
    const quiz = fixture.find(hasClass('system-quiz'));
    const body = find(quiz, 'quiz-body');
    const action = () => find(body, 'quiz-action');
    const choose = index => descendants(body).filter(node => node.type === 'radio')[index].dispatchEvent(new Event('change'));
    click(descendants(quiz).find(node => node.tagName === 'button' && node.textContent === 'Practice all questions'));
    for (const question of quizzes.spring) {
      const skip = find(body, 'quiz-skip'); if (skip) click(skip);
      choose(question.correct); click(action()); click(action());
    }
    assert.equal(quizMilestones('spring', quizzes.spring).explorer, true);
    assert.equal(quizMilestones('spring', quizzes.spring).mastery, false);
    click(descendants(quiz).find(node => node.tagName === 'button' && node.textContent === 'Experiment challenges'));
    for (const question of quizzes.spring.filter(question => question.experiment)) {
      choose(question.correct); click(action());
      for (let index = 0; index < 2; index++) {
        click(descendants(fixture.root).filter(hasClass('quiz-run'))[index]);
        assert.equal(find(quiz, 'quiz-window').hidden, false, 'running keeps the experiment controls in the open panel');
        fixture.frame(0); fixture.frame(100000);
        click(find(quiz, 'quiz-launcher'));
      }
      click(fixture.find(hasClass('coach-next')));
      choose(question.experiment.reasoning.correct); click(action()); click(action());
    }
    const milestones = quizMilestones('spring', quizzes.spring);
    assert.equal(milestones.investigator, true); assert.equal(milestones.mastery, true);
    assert.equal(localStorage.getItem('physics-quiz-badge-v1-spring'), '1');
    assert.ok(find(body, 'quiz-earned'));
  } finally { demo?.dispose(); fixture.cleanup(); }
});

test('collapsed journey keeps its progress ring beside the title', () => {
  const fixture = browserFixture(), controller = new AbortController();
  try {
    const view = createAchievements({ lang: 'en', signal: controller.signal });
    assert.equal(view.open, false);
    const summary = view.children[0];
    const ring = descendants(summary).find(node => node.getAttribute('class') === 'journey-ring');
    assert.ok(ring);
    assert.equal(ring.parentNode, summary);
    assert.equal(ring.getAttribute('aria-label'), '0 of 14 demonstrations mastered');
    assert.match(ring.textContent, /0\/14/);
    view.open = true;
    assert.ok(view.children[0].children.includes(ring));
    view.setLanguage('he');
    assert.ok(descendants(view.children[0]).some(node => node.getAttribute('class') === 'journey-ring'));
  } finally { controller.abort(); fixture.cleanup(); }
});

test('visual achievements use three stars, compact counters, and requirements hidden on demand', () => {
  const fixture = browserFixture(), controller = new AbortController();
  try {
    const bank = quizzes.pulley;
    let state = readQuizProgress('pulley'); state.sessions = 1; saveQuizProgress('pulley', state);
    const view = createAchievements({ lang: 'en', signal: controller.signal, expanded: true });
    assert.equal(view.open, true);
    assert.ok(descendants(view).some(node => node.getAttribute('class') === 'journey-ring'));
    assert.equal(descendants(view).filter(hasClass('achievement-demo')).length, 14);
    assert.equal(Boolean(find(view, 'achievement-help').open), false);
    assert.equal(descendants(view).filter(hasClass('journey-next')).length, 0);
    const tile = descendants(view).filter(hasClass('achievement-demo')).find(tile => tile.children[0].href === '#/pulley');
    assert.equal(find(tile, 'achievement-stars').getAttribute('data-earned'), '1');
    state = readQuizProgress('pulley'); state.investigations = bank.filter(question => question.experiment).map(question => question.id); saveQuizProgress('pulley', state);
    const updated = descendants(view).filter(hasClass('achievement-demo')).find(tile => tile.children[0].href === '#/pulley');
    assert.equal(find(updated, 'achievement-stars').getAttribute('data-earned'), '2');
    assert.equal(descendants(updated).filter(hasClass('achievement-star')).length, 3);
    view.setLanguage('he'); assert.match(find(view, 'achievement-help').textContent, /איך משיגים כוכבים/);
  } finally { controller.abort(); fixture.cleanup(); }
});


test('journey trophy and collection cards advance through the shared metal tiers', () => {
  const fixture = browserFixture(), controller = new AbortController();
  try {
    const view = createAchievements({ lang: 'en', signal: controller.signal });
    assert.equal(view.children[0].getAttribute('data-achievement-tier'), 'none');
    for (const [index, tier] of ['bronze', 'silver', 'gold'].entries()) {
      for (const entry of demonstrations) {
        const bank = quizzes[entry.id], state = readQuizProgress(entry.id);
        state.sessions = 1;
        if (index >= 1) state.investigations = bank.filter(question => question.experiment).map(question => question.id);
        if (index >= 2) state.answers = Object.fromEntries(bank.map(question => [question.id, { seen: true, clean: true, solved: true, attempts: 1 }]));
        saveQuizProgress(entry.id, state);
      }
      assert.equal(view.children[0].getAttribute('data-achievement-tier'), tier);
      for (const card of find(view, 'collection-achievements').children) {
        assert.equal(card.getAttribute('data-achievement-tier'), tier);
      }
    }
  } finally { controller.abort(); fixture.cleanup(); }
});

test('one star is bronze, two are silver, and three are gold on stars and demonstration frames', () => {
  const fixture = browserFixture(), controller = new AbortController();
  try {
    const system = 'basketball', bank = quizzes[system];
    for (const [index, tier] of ['bronze', 'silver', 'gold'].entries()) {
      const state = readQuizProgress(system); state.sessions = 1;
      if (index >= 1) state.investigations = bank.filter(question => question.experiment).map(question => question.id);
      if (index >= 2) state.answers = Object.fromEntries(bank.map(question => [question.id, { seen: true, clean: true, solved: true, attempts: 1 }]));
      saveQuizProgress(system, state);
      const summary = createAchievementSummary(system, 'en');
      assert.equal(summary.getAttribute('data-achievement-tier'), tier);
      assert.equal(find(summary, 'achievement-stars').getAttribute('data-earned'), String(index + 1));
      assert.equal(find(summary, 'achievement-stars').getAttribute('data-achievement-tier'), tier);
      const card = fixture.document.createElement('a'); decorateAchievementCard(card, system);
      assert.equal(card.getAttribute('data-achievement-tier'), tier);
      const view = createAchievements({ lang: 'he', signal: controller.signal });
      const tile = descendants(view).filter(hasClass('achievement-demo')).find(node => node.children[0].href === `#/${system}`);
      assert.equal(tile.getAttribute('data-achievement-tier'), tier);
    }
  } finally { controller.abort(); fixture.cleanup(); }
});

test('guided challenge keeps the quiz open with A/B controls inside the panel, waits for a cycle, pauses, recovers, and asks a separate explanation', async () => {
  const fixture = browserFixture(); let demo;
  try {
    const mount = (await demonstrations.find(entry => entry.id === 'spring').load()).mount;
    demo = mount({ root: fixture.root, lang: 'en' });
    const quiz = fixture.find(hasClass('system-quiz'));
    click(find(quiz, 'quiz-launcher'));
    click(descendants(quiz).find(node => node.tagName === 'button' && node.textContent === 'Experiment challenges'));
    let body = find(quiz, 'quiz-body');
    const question = quizzes.spring.filter(question => question.experiment)[0];
    const choose = index => descendants(body).filter(node => node.type === 'radio')[index].dispatchEvent(new Event('change'));
    choose((question.correct + 1) % 3); click(find(body, 'quiz-action'));
    const coach = fixture.find(hasClass('experiment-coach'));
    const panel = find(quiz, 'quiz-window');
    assert.equal(coach.parentNode, panel);
    assert.equal(coach.hidden, false); assert.equal(panel.hidden, false);
    assert.equal(find(quiz, 'quiz-launcher').getAttribute('aria-expanded'), 'true');
    assert.equal(body.hidden, true);
    assert.equal(fixture.frames.size, 0, 'making a prediction must not autoplay');
    assert.equal(descendants(coach).filter(hasClass('quiz-run'))[1].disabled, true);
    click(find(coach, 'coach-next'));
    const runA = descendants(coach).filter(hasClass('quiz-run'))[0];
    fixture.frame(0); fixture.frame(100);
    assert.equal(readQuizProgress('spring').active.current.observed[0], false, 'a tenth of a second is not a completed oscillation');
    assert.equal(descendants(coach).filter(hasClass('quiz-run'))[0], runA, 'progress updates preserve focused controls');
    click(fixture.find(node => node.tagName === 'button' && node.textContent === 'Pause'));
    assert.equal(find(coach, 'coach-next').textContent, 'Continue playback');
    click(find(coach, 'coach-next')); fixture.frame(1000); fixture.frame(100000);
    assert.equal(readQuizProgress('spring').active.current.observed[0], true);
    assert.ok(readQuizProgress('spring').active.current.observedTimes[0] > 1);
    assert.equal(fixture.frames.size, 0, 'the guided run pauses after a full cycle');
    assert.equal(panel.hidden, false, 'the panel stays open after run A');
    click(find(quiz, 'quiz-close'));
    assert.equal(panel.hidden, true);
    click(find(quiz, 'quiz-launcher'));
    assert.equal(panel.hidden, false);
    assert.equal(coach.hidden, false, 'reopening restores experiment controls');
    assert.equal(coach.hidden, false, 'no reopening the quiz between A and B');
    assert.equal(find(coach, 'coach-next').textContent, 'Run B');
    click(find(coach, 'coach-next'));
    const mass = fixture.find(node => node.id === 'spring-mass'); mass.value = '10'; mass.dispatchEvent(new Event('change'));
    assert.equal(readQuizProgress('spring').active.current.observed[1], false);
    assert.equal(find(coach, 'quiz-experiment-error').hidden, false, 'editing setup must cancel credit and offer replay');
    click(descendants(coach).filter(hasClass('quiz-run'))[1]); fixture.frame(0); fixture.frame(100000);
    assert.equal(find(coach, 'quiz-experiment-error').hidden, true);
    click(find(coach, 'coach-next'));
    assert.equal(coach.hidden, true); assert.equal(find(quiz, 'quiz-window').hidden, false);
    assert.equal(body.hidden, false, 'explanation returns inside the same panel');
    const legend = descendants(body).find(node => node.tagName === 'legend');
    assert.equal(legend.textContent, question.experiment.reasoning.prompt.en);
    assert.notEqual(legend.textContent, question.prompt.en);
    choose((question.experiment.reasoning.correct + 1) % 3); click(find(body, 'quiz-action'));
    assert.equal(readQuizProgress('spring').investigations.length, 0);
    click(find(body, 'quiz-action')); choose(question.experiment.reasoning.correct); click(find(body, 'quiz-action'));
    assert.equal(readQuizProgress('spring').investigations.includes(question.id), true);
    assert.equal(readQuizProgress('spring').answers[question.id].clean, false);
    assert.match(find(body, 'challenge-reflection').textContent, /challenged your prediction/);
    demo.dispose(); demo = mount({ root: fixture.root, lang: 'he' });
    const restored = fixture.find(hasClass('system-quiz')); click(find(restored, 'quiz-launcher'));
    body = find(restored, 'quiz-body');
    assert.equal(descendants(body).find(node => node.tagName === 'legend').textContent, question.experiment.reasoning.prompt.he);
    assert.equal(fixture.frames.size, 0);
  } finally { demo?.dispose(); fixture.cleanup(); }
});

test('every challenge has localized reasoning, one highlighted parameter, and a useful observation interval', () => {
  for (const bank of Object.values(quizzes)) for (const question of bank) {
    if (!question.experiment) continue;
    const { reasoning, change, observationFraction } = question.experiment;
    for (const lang of ['en', 'he']) {
      assert.ok(reasoning.prompt[lang] && reasoning.explanation[lang]);
      assert.notEqual(reasoning.prompt[lang], question.prompt[lang]);
      assert.equal(reasoning.options[lang].length, 3);
      assert.equal(reasoning.feedback[lang].length, 3);
      assert.ok(reasoning.feedback[lang].every(Boolean));
      assert.ok(change.label[lang]);
    }
    assert.notEqual(change.values[0], change.values[1]);
    assert.ok(observationFraction > 0 && observationFraction <= 1);
    assert.ok(reasoning.correct >= 0 && reasoning.correct < 3);
  }
});


test('saved challenges from the former repeat-question flow reopen safely in the new guide', () => {
  const fixture = browserFixture(), controller = new AbortController();
  try {
    const progress = readQuizProgress('spring');
    progress.active = { ids: ['spring-2'], index: 0, results: [], mode: 'experiments', completed: false,
      current: { selected: 2, prediction: 2, checked: true, observed: [true, true], firstCorrect: true } };
    saveQuizProgress('spring', progress);
    const quiz = createQuiz({ system: 'spring', lang: 'en', signal: controller.signal, runExperiment() {} }); fixture.root.append(quiz.root);
    click(find(quiz.root, 'quiz-launcher'));
    const coach = fixture.find(hasClass('experiment-coach'));
    assert.equal(coach.hidden, false); assert.equal(find(coach, 'coach-next').textContent, 'Run A');
    assert.equal(fixture.frames.size, 0);
  } finally { controller.abort(); fixture.cleanup(); }
});

for (const remaining of [1, 2]) {
  test(`next set contains only the ${remaining} unsolved questions and saves completion`, () => {
    const fixture = browserFixture(), controller = new AbortController();
    try {
      const bank = quizzes.spring;
      bank.slice(0, -remaining).forEach(question => recordQuizAnswer('spring', question, { correct: true }));
      bank.slice(-remaining).forEach(question => recordQuizAnswer('spring', question, { correct: false }));
      const quiz = createQuiz({ system: 'spring', lang: 'en', signal: controller.signal });
      fixture.root.append(quiz.root);
      click(descendants(quiz.root).find(node => node.tagName === 'button' && node.textContent === 'Start next set'));
      assert.deepEqual(readQuizProgress('spring').active.ids, bank.slice(-remaining).map(q => q.id));
      for (const question of bank.slice(-remaining)) {
        descendants(quiz.root).filter(node => node.type === 'radio')[question.correct].dispatchEvent(new Event('change'));
        click(find(quiz.root, 'quiz-action')); click(find(quiz.root, 'quiz-action'));
      }
      assert.deepEqual(selectQuizQuestions('spring', bank), []);
      assert.equal(descendants(find(quiz.root, 'quiz-body')).some(node => node.textContent === 'Start next set'), false);
      const reopened = createQuiz({ system: 'spring', lang: 'en', signal: controller.signal });
      assert.equal(Boolean(find(reopened.root, 'quiz-options')), false);
      click(descendants(reopened.root).find(node => node.tagName === 'button' && node.textContent === 'Practice all questions'));
      assert.equal(readQuizProgress('spring').active.ids.length, bank.length);
    } finally { controller.abort(); fixture.cleanup(); }
  });
}

test('all solved questions open a completion message without an empty score', () => {
  const fixture = browserFixture(), controller = new AbortController();
  try {
    quizzes.spring.forEach(question => recordQuizAnswer('spring', question, { correct: true }));
    const quiz = createQuiz({ system: 'spring', lang: 'en', signal: controller.signal });
    assert.equal(find(quiz.root, 'quiz-result').textContent, 'You have solved every question!');
    assert.equal(find(quiz.root, 'quiz-result-score'), undefined);
    quiz.setLanguage('he');
    assert.equal(find(quiz.root, 'quiz-result').textContent, 'פתרתם את כל השאלות!');
  } finally { controller.abort(); fixture.cleanup(); }
});
