import { element, svgElement as s, svgText } from './dom.js';
import { demonstrations } from '../registry.js';
import { quizzes } from './quiz-data.js';
import { quizMilestones, quizProgressEvents, quizStorageAvailable } from './quiz-progress.js';
import { hasQuizBadge } from './quiz-badges.js';
export const achievementCopy = {
  en: {
    title: 'Physics journey', bronze: 'Bronze', silver: 'Silver', gold: 'Gold', help: 'How to earn stars', stars: 'Stars', saved: 'Saved on this device', visit: 'This visit only', earned: 'Earned', locked: 'Not earned yet', explorer: 'Explorer', investigator: 'Investigator', mastery: 'Mastery',
    explorerRule: 'Finish a five-question set.', investigatorRule: 'Earn Explorer, then predict, observe both setups, and explain every experiment challenge.',
    masteryRule: 'Earn Investigator, answer all ten questions without help across any number of sets, and resolve concept reviews with a different question.',
    local: 'Progress is saved in this browser. No account needed.', temporary: 'Browser storage is unavailable. Progress lasts for this visit.',
    next: 'Next step', complete: 'All milestones earned. Keep exploring!', legacy: 'Your previously earned star is preserved.',
    overall: (n, total) => `${n} of ${total} demonstrations mastered`,
    explored: (n, total) => `${n} of ${total} demonstrations explored`,
    known: (n, total) => `${n}/${total} questions answered without help`,
    investigated: (n, total) => `${n}/${total} experiment challenges completed`,
    review: n => `${n} concepts to revisit with a different question`,
    finish: 'Complete a five-question set to earn Explorer.',
    investigate: 'Complete the remaining experiment challenges to earn Investigator.',
    master: 'Answer the remaining questions without help and complete concept reviews to earn Mastery.',
    groups: ['Oscillation insight', 'Friction', 'Motion and balance', 'Circular motion', 'Physics collection complete'],
  },
  he: {
    title: 'המסע בפיזיקה', bronze: 'ארד', silver: 'כסף', gold: 'זהב', help: 'איך משיגים כוכבים', stars: 'כוכבים', saved: 'נשמר במכשיר הזה', visit: 'לביקור הזה בלבד', earned: 'הושג', locked: 'טרם הושג', explorer: 'היכרות', investigator: 'חקירה', mastery: 'שליטה בחומר',
    explorerRule: 'השלימו מקבץ של חמש שאלות.', investigatorRule: 'השלימו את שלב ההיכרות ואת כל אתגרי הניסוי: בכל אתגר העלו השערה, הפעילו את שני המצבים וענו נכון על שאלת ההסבר.',
    masteryRule: 'השלימו את שלב החקירה וענו על כל עשר השאלות ללא עזרה, במקבץ אחד או בכמה מקבצים. בנושאים שבהם טעיתם, ענו גם על שאלה אחרת באותו נושא.',
    local: 'ההתקדמות נשמרת בדפדפן הזה. אין צורך בחשבון.', temporary: 'אחסון הדפדפן אינו זמין. ההתקדמות נשמרת לביקור הזה בלבד.',
    next: 'הצעד הבא', complete: 'השלמתם את כל ההישגים. אפשר להמשיך לחקור!', legacy: 'הכוכב שהשגתם בעבר נשמר.',
    overall: (n, total) => `הושגה שליטה ב־${n} מתוך ${total} מערכות`, explored: (n, total) => `הושלם שלב ההיכרות ב־${n} מתוך ${total} מערכות`,
    known: (n, total) => `${n}/${total} שאלות נענו ללא עזרה`, investigated: (n, total) => `${n}/${total} אתגרי ניסוי הושלמו`,
    review: n => `${n} נושאים לתרגול נוסף בשאלה אחרת`, finish: 'השלימו מקבץ של חמש שאלות כדי להשיג את כוכב ההיכרות.',
    investigate: 'השלימו את אתגרי הניסוי שנותרו כדי להשיג את כוכב החקירה.',
    master: 'ענו ללא עזרה על השאלות שנותרו ותרגלו שוב את הנושאים שבהם טעיתם כדי להשיג את כוכב השליטה בחומר.',
    groups: ['תנודות ותנועה הרמונית', 'חיכוך במערכות גופים', 'תנועה ואיזון', 'חוקרי תנועה מעגלית', 'השלמת כל המערכות'],
  },
};
const milestoneNames = ['explorer', 'investigator', 'mastery'];
const tiers = ['none', 'bronze', 'silver', 'gold'];
function tierFor(state) { return tiers[milestoneNames.filter(name => state[name]).length]; }
export function decorateAchievementCard(node, system) {
  node.setAttribute('data-achievement-tier', tierFor(quizMilestones(system, quizzes[system])));
}
const starPath = 'm12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9Z';
function icon(kind, className = '') {
  const svg = s('svg', { viewBox: '0 0 24 24', class: `achievement-icon ${className}`, 'aria-hidden': 'true', focusable: 'false', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const paths = {
    star: starPath,
    book: 'M12 5v15M12 5Q7 2 3 4v14q5-2 9 2 4-4 9-2V4q-4-2-9 1Z',
    flask: 'M9 3h6m-5 0v6L4 19q-1 2 2 2h12q3 0 2-2L14 9V3M7 15h10',
    review: 'M4 9a8 8 0 1 1 0 6M4 4v5h5',
    pendulum: 'M4 3h16M12 3l6 14M8 19q5 3 10 0',
    friction: 'M3 20h18M7 16V8h10v8ZM2 6h4m12 0h4M2 4l3 2-3 2m20-4-3 2 3 2',
    motion: 'M3 19Q8-5 20 12M15 12h5V7',
    orbit: 'M4 12a8 8 0 1 0 8-8M12 1v6M9 4h6',
    trophy: 'M8 3h8v6a4 4 0 0 1-8 0ZM8 5H4v3q0 4 5 4m7-7h4v3q0 4-5 4m-3 1v6m-4 2h8m-6-2h4',
  };
  s('path', { d: paths[kind] ?? starPath }, svg);
  if (kind === 'pendulum') s('circle', { cx: 18, cy: 17, r: 3 }, svg);
  return svg;
}
function starStrip(state, t) {
  const root = element('div', 'achievement-stars');
  const count = milestoneNames.filter(name => state[name]).length;
  root.setAttribute('role', 'group'); root.setAttribute('aria-label', `${count}/3 ${t.stars}`);
  root.setAttribute('data-earned', String(count));
  root.setAttribute('data-achievement-tier', tiers[count]);
  if (count) root.setAttribute('aria-label', `${count}/3 ${t.stars} · ${t[tiers[count]]}`);
  let next = false;
  for (const name of milestoneNames) {
    const isNext = !state[name] && !next;
    if (isNext) next = true;
    const item = element('span', `achievement-star${state[name] ? ' is-earned' : isNext ? ' is-next' : ''}`);
    item.title = `${t[name]} · ${state[name] ? t.earned : t.locked}. ${t[`${name}Rule`]}`;
    item.setAttribute('role', 'img'); item.setAttribute('aria-label', item.title);
    item.append(icon('star')); root.append(item);
  }
  return root;
}
function progressBar(value, total, label) {
  const bar = element('progress', 'achievement-progress');
  bar.max = total || 1; bar.value = value; bar.setAttribute('aria-label', label); bar.title = label;
  return bar;
}
function counter(kind, value, total, label) {
  const pill = element('span', 'achievement-counter'); pill.title = label; pill.setAttribute('aria-label', label);
  pill.append(icon(kind), element('span', '', `${value}/${total}`)); return pill;
}
function nextRequirement(state, t) {
  return state.mastery ? t.complete : !state.explorer ? t.finish : !state.investigator ? t.investigate : t.master;
}
export function createQuizJourney(system, lang) {
  const t = achievementCopy[lang], state = quizMilestones(system, quizzes[system]);
  const root = element('div', 'quiz-journey');
  root.setAttribute('data-achievement-tier', tierFor(state));
  root.append(starStrip(state, t));
  const counters = element('div', 'journey-counters');
  counters.append(counter('book', state.understood, quizzes[system].length, t.known(state.understood, quizzes[system].length)),
    counter('flask', state.investigations, state.challenges, t.investigated(state.investigations, state.challenges)));
  if (state.review) counters.append(counter('review', state.review, new Set(quizzes[system].map(question => question.topic)).size, t.review(state.review)));
  root.append(counters, progressBar(state.understood, quizzes[system].length, t.known(state.understood, quizzes[system].length)),
    element('span', 'sr-only', `${t.next}: ${nextRequirement(state, t)}`));
  if (hasQuizBadge(system) && !state.mastery) root.append(element('span', 'sr-only', t.legacy));
  return root;
}
export function createAchievementSummary(system, lang) {
  const t = achievementCopy[lang], state = quizMilestones(system, quizzes[system]);
  const root = element('div', 'card-achievements');
  root.setAttribute('data-achievement-tier', tierFor(state));
  root.append(starStrip(state, t));
  const count = element('span', 'card-star-count', `${milestoneNames.filter(name => state[name]).length}/3`);
  count.title = `${t.next}: ${nextRequirement(state, t)}`;
  root.append(count); return root;
}
export function createAchievements({ lang, signal, expanded = false }) {
  const root = element('details', 'achievements'); root.open = expanded;
  const summary = element('summary');
  const body = element('div', 'achievements-body'); root.append(summary, body);
  function update() {
    const t = achievementCopy[lang];
    const states = demonstrations.map(entry => quizMilestones(entry.id, quizzes[entry.id]));
    const mastered = states.filter(state => state.mastery).length;
    const collectionTier = groupStates => tiers[milestoneNames.filter(name => groupStates.every(state => state[name])).length];
    summary.setAttribute('data-achievement-tier', collectionTier(states));
    body.replaceChildren();
    const overview = element('div', 'journey-overview');
    const ring = s('svg', { viewBox: '0 0 100 100', class: 'journey-ring', role: 'img', 'aria-label': t.overall(mastered, states.length) });
    s('circle', { cx: 50, cy: 50, r: 42, class: 'journey-ring-track' }, ring);
    s('circle', { cx: 50, cy: 50, r: 42, class: 'journey-ring-fill', pathLength: 100, 'stroke-dasharray': `${mastered / states.length * 100} 100`, transform: 'rotate(-90 50 50)' }, ring);
    svgText(ring, 50, 56, `${mastered}/${states.length}`, { 'text-anchor': 'middle' });
    summary.replaceChildren(icon('trophy'), element('span', '', t.title), ring, element('span', 'sr-only', t.overall(mastered, states.length)));
    ring.setAttribute('aria-hidden', 'true');
    const totals = element('div', 'journey-milestone-totals');
    for (const [index, name] of milestoneNames.entries()) {
      const total = states.filter(state => state[name]).length;
      const row = element('div', 'journey-milestone-total'); row.title = `${t[name]}: ${t[`${name}Rule`]}`;
      row.setAttribute('data-achievement-tier', tiers[index + 1]);
      const label = element('span', 'milestone-metal-label'); label.append(icon('star'), element('span', '', t[name]));
      row.append(label, element('strong', '', `${total}/${states.length}`), progressBar(total, states.length, `${t[name]}: ${total}/${states.length}`));
      totals.append(row);
    }
    overview.append(totals); body.append(overview);
    const groups = [
      ['spring', 'double-spring', 'pendulum'],
      ['incline', 'friction-stacked', 'friction-table', 'friction-hanging'],
      ['basketball', 'pulley', 'elevator'],
      ['carousel', 'rotating-tube', 'two-string', 'energy-bowl'],
      demonstrations.map(entry => entry.id),
    ];
    const collection = element('ul', 'collection-achievements');
    groups.forEach((ids, index) => {
      const count = ids.filter(id => states[demonstrations.findIndex(entry => entry.id === id)].mastery).length;
      const badge = element('li', count === ids.length ? 'is-earned' : '');
      badge.setAttribute('data-achievement-tier', collectionTier(ids.map(id => states[demonstrations.findIndex(entry => entry.id === id)])));
      badge.title = `${t.groups[index]}: ${count}/${ids.length}`;
      badge.append(icon(['pendulum', 'friction', 'motion', 'orbit', 'trophy'][index]), element('span', 'collection-badge-name', t.groups[index]), element('strong', '', `${count}/${ids.length}`), progressBar(count, ids.length, badge.title));
      collection.append(badge);
    });
    body.append(collection);
    const list = element('div', 'achievement-list');
    for (const entry of demonstrations) {
      const card = element('article', 'achievement-demo');
      decorateAchievementCard(card, entry.id);
      const link = element('a', '', entry.title[lang]); link.href = `#/${entry.id}`;
      card.append(link, createQuizJourney(entry.id, lang)); list.append(card);
    }
    body.append(list);
    const rules = element('details', 'achievement-help');
    rules.append(element('summary', '', t.help));
    const explanations = element('ol', 'achievement-rules');
    for (const [index, name] of milestoneNames.entries()) {
      const rule = element('li', '', `${index + 1} · ${t[tiers[index + 1]]} · ${t[name]}: ${t[`${name}Rule`]}`);
      rule.setAttribute('data-achievement-tier', tiers[index + 1]); explanations.append(rule);
    }
    rules.append(explanations); body.append(rules);
    const storage = quizStorageAvailable();
    body.append(element('p', 'achievement-storage', storage ? t.saved : t.visit), element('span', 'sr-only', t[storage ? 'local' : 'temporary']));
  }
  quizProgressEvents.addEventListener('change', update, { signal });
  root.setLanguage = next => { lang = next; update(); };
  update(); return root;
}
