import { element, svgElement as s } from './dom.js';

const earnedThisSession = new Set();
const key = system => `physics-quiz-badge-v1-${system}`;

export function hasQuizBadge(system) {
  if (earnedThisSession.has(system)) return true;
  try { return localStorage.getItem(key(system)) === '1'; } catch { return false; }
}

export function awardQuizBadge(system) {
  earnedThisSession.add(system);
  try { localStorage.setItem(key(system), '1'); } catch { /* Keep the badge for this session if storage is unavailable. */ }
}

export function createQuizBadge(system, lang) {
  if (!hasQuizBadge(system)) return null;
  const badge = element('span', 'quiz-badge');
  const label = lang === 'he' ? 'כל התשובות בבוחן נכונות' : 'Quiz completed with all answers correct';
  badge.setAttribute('role', 'img'); badge.setAttribute('aria-label', label); badge.title = label;
  const svg = s('svg', { viewBox: '0 0 64 64', 'aria-hidden': 'true', focusable: 'false' }, badge);
  const star = 'M 29 9 Q 32 3 35 9 L 41 21 L 54 23 Q 61 24 56 29 L 46 39 L 48 53 Q 49 60 43 57 L 32 51 L 21 57 Q 15 60 16 53 L 18 39 L 8 29 Q 3 24 10 23 L 23 21 Z';
  s('path', { d: star, fill: '#c98128', transform: 'translate(0 3)', opacity: '.35' }, svg);
  s('path', { d: star, fill: '#ffd34f', stroke: '#81501f', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, svg);
  s('path', { d: 'M 28 20 L 31 13 M 13 27 L 22 26', fill: 'none', stroke: '#fff7c2', 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
  return badge;
}
