import { hasQuizBadge } from './quiz-badges.js';
import { quizzes } from './quiz-data.js';
// Versioned, local-only learning progress. Storage failure leaves a session fallback.
const fallback = new Map();
const writeBlocked = new WeakSet();
export const quizProgressEvents = new EventTarget();
const key = system => `physics-quiz-progress-v1-${system}`;
const fresh = () => ({ answers: {}, review: {}, investigations: [], sessions: 0, earned: [], active: null });
export function quizStorageAvailable() {
  try { const storage = globalThis.localStorage; return Boolean(storage && typeof storage.getItem === 'function' && !writeBlocked.has(storage)); } catch { return false; }
}
export function readQuizProgress(system) {
  let stored, storageRead = false;
  try {
    const storage = globalThis.localStorage;
    if (storage && !writeBlocked.has(storage)) { storageRead = true; stored = JSON.parse(storage.getItem(key(system)) ?? 'null'); }
  } catch { /* Use session progress if storage is blocked. */ }
  const value = storageRead ? stored : fallback.get(system);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fresh();
  const result = fresh();
  if (value.answers && typeof value.answers === 'object' && !Array.isArray(value.answers)) {
    for (const [id, answer] of Object.entries(value.answers)) if (answer && typeof answer === 'object') {
      result.answers[id] = { seen: true, clean: answer.clean === true, solved: answer.solved === true, attempts: Math.max(0, Number(answer.attempts) || 0) };
    }
  }
  if (value.review && typeof value.review === 'object' && !Array.isArray(value.review)) {
    for (const [topic, id] of Object.entries(value.review)) if (typeof id === 'string') result.review[topic] = id;
  }
  result.investigations = Array.isArray(value.investigations) ? [...new Set(value.investigations.filter(id => typeof id === 'string'))] : [];
  result.sessions = Number.isInteger(value.sessions) && value.sessions >= 0 ? value.sessions : 0;
  result.earned = Array.isArray(value.earned) ? value.earned.filter(id => ['explorer', 'investigator', 'mastery'].includes(id)) : [];
  result.active = value.active && typeof value.active === 'object' ? value.active : null;
  return result;
}
export function saveQuizProgress(system, value) {
  const bank = quizzes[system];
  if (bank) {
    const challenges = bank.filter(question => question.experiment);
    // An existing perfect-quiz star carries forward as the introductory star.
    const explorer = value.sessions > 0 || hasQuizBadge(system) || value.earned?.includes('explorer');
    const investigator = explorer && challenges.length > 0 && challenges.every(question => value.investigations.includes(question.id));
    const mastery = investigator && bank.every(question => value.answers[question.id]?.clean) && !Object.keys(value.review).length;
    value.earned = [...new Set([...(value.earned ?? []), ...(explorer ? ['explorer'] : []), ...(investigator ? ['investigator'] : []), ...(mastery ? ['mastery'] : [])])];
  }
  // Copy so callers cannot change saved progress without a write.
  fallback.set(system, JSON.parse(JSON.stringify(value)));
  let storage;
  try { storage = globalThis.localStorage; storage?.setItem(key(system), JSON.stringify(value)); if (storage) writeBlocked.delete(storage); }
  catch { if (storage) writeBlocked.add(storage); /* Session fallback remains available. */ }
  quizProgressEvents.dispatchEvent(new Event('change'));
}
export function recordQuizAnswer(system, question, { correct, assisted = false, investigation = false }) {
  const progress = readQuizProgress(system);
  const previous = progress.answers[question.id] ?? { attempts: 0 };
  progress.answers[question.id] = { seen: true, attempts: previous.attempts + 1,
    solved: previous.solved || correct, clean: previous.clean || (correct && !assisted) };
  if (!correct || assisted) {
    progress.review[question.topic] = question.id;
  } else if (progress.review[question.topic] && progress.review[question.topic] !== question.id) {
    // An independent question on the concept clears review; repeating a revealed
    // answer alone never clears it.
    delete progress.review[question.topic];
  }
  if (investigation && correct && !progress.investigations.includes(question.id)) progress.investigations.push(question.id);
  saveQuizProgress(system, progress);
}
export function quizQuestionPriority(progress, question) {
  const answer = progress.answers[question.id];
  if (!answer || !(answer.attempts > 0 || answer.solved || answer.clean)) return 0;
  if (!answer.solved && !answer.clean) return 1;
  if (progress.review[question.topic] && progress.review[question.topic] !== question.id) return 2;
  return answer.clean ? 4 : 3;
}
export function selectQuizQuestions(system, bank, count = 5) {
  const progress = readQuizProgress(system);
  // Completed questions only return through an explicitly chosen practice mode.
  const remaining = bank.filter(question => {
    const answer = progress.answers[question.id];
    return !answer?.solved && !answer?.clean;
  });
  const ordered = remaining.map((question, index) => ({ question, index, rank:
    quizQuestionPriority(progress, question),
    attempts: progress.answers[question.id]?.attempts ?? 0,
  })).sort((a, b) => a.rank - b.rank || a.attempts - b.attempts || a.index - b.index);
  // Balance concepts within each priority group, putting unseen and incorrectly answered questions before solved ones.
  const selected = [], topics = new Set();
  for (const rank of [0, 1, 2, 3, 4]) {
    const group = ordered.filter(item => item.rank === rank);
    if (rank <= 1) {
      for (const item of group) {
        selected.push(item.question); topics.add(item.question.topic);
        if (selected.length === count) return selected;
      }
      continue;
    }
    for (const item of group) if (!topics.has(item.question.topic)) { selected.push(item.question); topics.add(item.question.topic); if (selected.length === count) return selected; }
    for (const item of group) if (!selected.includes(item.question)) { selected.push(item.question); topics.add(item.question.topic); if (selected.length === count) return selected; }
  }
  return selected;
}
export function quizMilestones(system, bank) {
  const progress = readQuizProgress(system);
  const known = new Set(bank.map(question => question.id));
  const practiced = bank.filter(question => progress.answers[question.id]?.seen).length;
  const understood = bank.filter(question => progress.answers[question.id]?.clean).length;
  const challenges = bank.filter(question => question.experiment);
  const investigations = progress.investigations.filter(id => known.has(id) && challenges.some(question => question.id === id)).length;
  const review = Object.keys(progress.review).filter(topic => bank.some(question => question.topic === topic)).length;
  const explorer = progress.earned.includes('explorer') || progress.sessions > 0 || hasQuizBadge(system);
  const investigator = progress.earned.includes('investigator') || (explorer && challenges.length > 0 && investigations === challenges.length);
  const mastery = progress.earned.includes('mastery') || (investigator && understood === bank.length && review === 0);
  return { explorer, investigator, mastery, practiced, understood, investigations, challenges: challenges.length, review, progress };
}
