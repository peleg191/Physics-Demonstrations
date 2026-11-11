import { addSketchOutlines, prepareSketchOutlines } from './core/sketch.js';
import { resolveIllustrationStyle, illustrationSource } from './core/presentation.js';
import { demonstrations } from './registry.js';
import { translator } from './core/i18n.js';
import { element, svgElement } from './core/dom.js';
import { createAchievements, createAchievementSummary, decorateAchievementCard } from './core/quiz-achievements.js';
let savedStyle;
try { savedStyle = localStorage.getItem('physics-illustration-style'); } catch { /* Storage is optional. */ }
let illustrationStyle = ['current', 'notebook'].includes(savedStyle)
  ? resolveIllustrationStyle(location.search, savedStyle) : resolveIllustrationStyle(location.search);
document.documentElement.dataset.illustrationStyle = illustrationStyle;
let lang = 'en';
try { const saved = localStorage.getItem('physics-language'); if (saved === 'he' || saved === 'en') lang = saved; } catch { /* Storage is optional. */ }
let active = null, activeEntry = null, routeVersion = 0, catalogController = null;
const main = document.querySelector('#main');
const languageButton = document.querySelector('#language');
const themeButton = document.querySelector('#theme');
const styleButton = document.querySelector('#illustration-style');
function styleChrome() {
  const label = lang === 'he' ? 'סגנון מחברת' : 'Notebook style';
  styleButton.setAttribute('aria-label', label); styleButton.title = label;
  styleButton.setAttribute('aria-pressed', String(illustrationStyle === 'notebook'));
}
styleButton.addEventListener('click', () => {
  illustrationStyle = illustrationStyle === 'notebook' ? 'current' : 'notebook';
  document.documentElement.dataset.illustrationStyle = illustrationStyle;
  try { localStorage.setItem('physics-illustration-style', illustrationStyle); } catch { /* Storage is optional. */ }
  // Keep explicit preview links in step with the user's button selection.
  const url = new URL(location.href);
  if (url.searchParams.has('style')) { url.searchParams.set('style', illustrationStyle); history.replaceState(null, '', url); }
  for (const image of document.querySelectorAll('img[data-illustration]')) image.src = illustrationSource(image.dataset.illustration, illustrationStyle, document.documentElement.dataset.theme);
  for (const scene of document.querySelectorAll('.system-svg, .hero-art')) addSketchOutlines(scene);
  styleChrome();
});
function themeChrome() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeButton.setAttribute('aria-pressed', String(dark));
  for (const image of document.querySelectorAll('img[data-illustration]')) image.src = illustrationSource(image.dataset.illustration, illustrationStyle, dark ? 'dark' : 'light');
  themeButton.setAttribute('aria-label', lang === 'he' ? 'מצב כהה' : 'Dark mode');
  themeButton.title = lang === 'he' ? 'מצב כהה' : 'Dark mode';
  themeButton.innerHTML = dark
    ? '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z"/></svg>';
  document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#151b17' : '#f3f2ec');
}
themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('physics-theme', theme); } catch { /* Storage is optional. */ }
  themeChrome();
});
function chrome() {
  themeChrome(); styleChrome();
  const t = translator(lang);
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.querySelector('#brand-name').textContent = t('brand');
  document.querySelector('.brand').setAttribute('aria-label', t('brand'));
  document.querySelector('#navigation').setAttribute('aria-label', t('nav'));
  document.querySelector('#catalog-link').textContent = t('collection');
  document.querySelector('#skip').textContent = t('skip');
  document.querySelector('#footer-title').textContent = t('footer'); document.querySelector('#footer-note').textContent = t('footerNote');
  languageButton.textContent = lang === 'en' ? 'עברית ↗' : 'English ↗'; languageButton.lang = lang === 'en' ? 'he' : 'en';
  document.title = `${activeEntry ? activeEntry.title[lang] + ' · ' : ''}${t('brand')}`;
}
function catalog(level = 'basic') {
  catalogController = new AbortController();
  const { signal } = catalogController;
  const entries = demonstrations.filter(entry => (entry.level || 'basic') === level);
  const t = translator(lang);
  const hero = element('section', 'hero');
  const copy = element('div', 'hero-copy');
  const heading = element('h1'); heading.append(document.createTextNode(t('hero')), element('span', 'hero-accent', t('heroAccent')));
  copy.append(heading, element('p', 'hero-intro', t('intro')));
  const art = element('div', 'hero-art'); art.setAttribute('aria-hidden', 'true');
  art.innerHTML = `<svg viewBox="0 0 720 160" fill="none" focusable="false">
    <defs><pattern id="hero-grid" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r=".8" fill="var(--muted)" opacity=".2"/></pattern></defs>
    <rect width="720" height="160" rx="12" fill="url(#hero-grid)"/>
    <g stroke="var(--muted)" stroke-width="1.2" opacity=".45">
      <path d="M16 104h142M25 104V20M176 142h126"/>
      <path d="m152 100 6 4-6 4M21 26l4-6 4 6"/>
    </g>
    <path d="M26 99Q80 -30 150 93" stroke="var(--green)" stroke-width="2" stroke-dasharray="4 5"/>
    <circle cx="86" cy="36" r="13" fill="var(--orange)" stroke="var(--ink)" stroke-width="1.5"/>
    <path d="M74 33q12 8 24 0m-13-10q-5 13 4 25" stroke="var(--ink)" stroke-width="1.2"/>
    <g stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M208 16h86m-72 0-6-7m24 7-6-7m24 7-6-7m24 7-6-7"/>
      <path d="M250 18v96" stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="3 5"/>
      <path d="M250 18l37 88"/>
      <path d="M214 106a96 96 0 0 0 73 0" stroke="var(--green)" stroke-width="1.5" stroke-dasharray="3 5"/>
      <circle cx="287" cy="106" r="15" fill="var(--green)"/>
      <circle cx="250" cy="18" r="3" fill="var(--ink)"/>
      <path d="M25 119v31m-6-25 6-6m-6 18 6-6m-6 18 6-6M26 136h10l6-10 9 20 9-20 9 20 9-20 9 20 6-10h13"/>
      <rect x="106" y="121" width="30" height="30" rx="4" fill="var(--orange)"/>
      <path d="M146 136h32m-6-4 6 4-6 4" stroke="var(--green)"/>
    </g>
    <g stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <g transform="translate(12 0)">
      <path d="M334 141h126L334 77Z" fill="var(--accent-soft)"/>
      <path d="M341 146l-5 5m23-5-5 5m23-5-5 5m23-5-5 5m23-5-5 5m23-5-5 5m23-5-5 5" stroke="var(--muted)" stroke-width="1"/>
      <g transform="translate(378 83) rotate(27)">
        <rect x="-17" y="-14" width="34" height="28" rx="3" fill="var(--orange)"/>
        <path d="M22 0h29m-6-4 6 4-6 4" stroke="var(--green)"/>
      </g>
      <path d="M420 131a24 24 0 0 0-4-12" stroke="var(--green)" stroke-width="1.3"/>
      </g>
      <g transform="translate(40 0)">
      <path d="M477 17h64m-53 0-5-7m21 7-5-7m21 7-5-7m21 7-5-7M510 17v16"/>
      <circle cx="510" cy="48" r="15" fill="var(--accent-soft)"/>
      <circle cx="510" cy="48" r="3" fill="var(--ink)"/>
      <path d="M495 48v42m30-42v65"/>
      <rect x="483" y="90" width="24" height="26" rx="3" fill="var(--green)"/>
      <rect x="513" y="113" width="24" height="34" rx="3" fill="var(--orange)"/>
      <path d="M474 79V59m-4 5 4-5 4 5M546 116v20m-4-5 4 5 4-5" stroke="var(--green)" stroke-width="1.5"/>
      </g>
    </g>
    <g transform="translate(671 79)">
      <circle r="40" stroke="var(--green)" stroke-width="1.5" stroke-dasharray="4 5"/>
      <path d="M-38 0h76M0-56v112" stroke="var(--muted)" stroke-width="1" opacity=".4"/>
      <path d="M0 0 24-32" stroke="var(--ink)" stroke-width="2"/>
      <circle r="5" fill="var(--orange)" stroke="var(--ink)" stroke-width="1.5"/>
      <circle cx="24" cy="-32" r="10" fill="var(--green)" stroke="var(--ink)" stroke-width="1.5"/>
      <path d="m-36 17 4 7 8-1" stroke="var(--green)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`;
  const count = element('p', 'experiment-count'), countNumber = element('strong', '', String(entries.length).padStart(2, '0'));
  count.append(countNumber, document.createTextNode(t('count')));
  hero.append(copy, art);
  const collection = element('section', 'collection');
  collection.setAttribute('aria-labelledby', 'collection-heading');
  const headingRow = element('div', 'collection-heading');
  const collectionTitle = element('h2', '', t('collectionTitle')); collectionTitle.id = 'collection-heading';
  headingRow.append(collectionTitle);
  const tabs = element('div', 'level-tabs'); tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', lang === 'he' ? 'רמת ההדגמות' : 'Demonstration level');
  const panel = element('div', 'catalog-panel'); panel.id = 'collection-panel';
  panel.setAttribute('role', 'tabpanel'); panel.setAttribute('tabindex', '0');
  const grid = element('div', 'catalog-grid'), tabButtons = new Map();
  function selectLevel(next, updateUrl = true) {
    if (updateUrl && next === level) return;
    // Keep the panel's height while switching to a shorter collection, so the
    // browser cannot clamp a visitor's current scroll position upward.
    if (updateUrl) panel.style.minHeight = `${Math.ceil(panel.getBoundingClientRect().height)}px`;
    level = next;
    const nextEntries = demonstrations.filter(entry => (entry.level || 'basic') === level);
    for (const [key, tab] of tabButtons) {
      tab.setAttribute('aria-selected', String(key === level));
      tab.setAttribute('tabindex', key === level ? '0' : '-1');
    }
    panel.setAttribute('aria-labelledby', `level-tab-${level}`);
    countNumber.textContent = String(nextEntries.length).padStart(2, '0');
    fillGrid(nextEntries);
    if (updateUrl) {
      const url = new URL(location.href); url.hash = level === 'basic' ? '#/' : '#/intermediate';
      history.replaceState(null, '', url);
    }
  }
  for (const [key, en, he] of [['basic', 'Basic systems', 'מערכות בסיסיות'], ['intermediate', 'Intermediate systems', 'מערכות ברמת ביניים']]) {
    const tab = element('button', 'level-tab', lang === 'he' ? he : en); tab.type = 'button'; tab.id = `level-tab-${key}`;
    tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', panel.id);
    tab.addEventListener('click', () => selectLevel(key), { signal });
    tab.addEventListener('keydown', event => {
      const keys = [...tabButtons.keys()], index = keys.indexOf(key), forward = lang === 'he' ? 'ArrowLeft' : 'ArrowRight';
      let next;
      if (event.key === 'Home') next = keys[0];
      else if (event.key === 'End') next = keys.at(-1);
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') next = keys[(index + (event.key === forward ? 1 : -1) + keys.length) % keys.length];
      if (next) { event.preventDefault(); selectLevel(next); tabButtons.get(next).focus({ preventScroll: true }); }
    }, { signal });
    tabButtons.set(key, tab); tabs.append(tab);
  }
  function fillGrid(nextEntries) {
    grid.replaceChildren();
    for (const entry of nextEntries) {
      const card = element('a', `experiment-card ${entry.id}`); card.href = `#/${entry.id}`;
      decorateAchievementCard(card, entry.id);
      const imageArea = element('div', 'card-image'); const number = element('span', 'card-number', entry.number);
      const image = element('img'); image.dataset.illustration = entry.illustration; image.src = illustrationSource(entry.illustration, illustrationStyle, document.documentElement.dataset.theme); image.alt = ''; image.width = 620; image.height = 280;
      const topic = element('span', 'topic-pill', t(entry.topic)); imageArea.append(number, image, topic);
      const content = element('div', 'card-content');
      const titleRow = element('div', 'card-title-row');
      titleRow.append(element('h3', '', entry.title[lang]), createAchievementSummary(entry.id, lang));
      content.append(titleRow, element('p', '', entry.description[lang]));
      const bottom = element('div', 'card-bottom'); const tags = element('div', 'tags');
      for (const tag of entry.tags[lang]) tags.append(element('span', '', tag));
      const arrow = element('span', 'card-arrow'); arrow.setAttribute('aria-hidden', 'true');
      const arrowIcon = svgElement('svg', { viewBox: '0 0 24 24', width: 18, height: 18, focusable: 'false', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      svgElement('path', { d: 'M6 18 18 6M6 6h12v12' }, arrowIcon);
      arrow.append(arrowIcon); bottom.append(tags, arrow);
      content.append(bottom); card.append(imageArea, content); grid.append(card);
    }
  }
  selectLevel(level, false);
  const toolbar = element('div', 'collection-toolbar');
  toolbar.append(tabs, count);
  panel.append(headingRow, grid); collection.append(toolbar, panel);
  window.addEventListener('resize', () => { panel.style.minHeight = ''; }, { signal });
  main.replaceChildren(hero, createAchievements({ lang, signal }), collection); prepareSketchOutlines(art);
}
function demoHeading(entry) {
  const t = translator(lang); const top = element('div', 'demo-heading');
  const back = element('a', 'back-link'); back.href = entry.level === 'intermediate' ? '#/intermediate' : '#/';
  const backIcon = svgElement('svg', { class: 'back-link-icon', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  svgElement('path', { d: 'M19 12H5m6-6-6 6 6 6' }, backIcon);
  const backLabel = element('span', '', t('back')); back.append(backIcon, backLabel);
  const text = element('div', 'demo-heading-copy');
  const title = element('h1', '', entry.title[lang]); const description = element('p', 'demo-description', entry.description[lang]);
  const titleRow = element('div', 'demo-title-row');
  const actions = element('div', 'demo-heading-actions');
  titleRow.append(title, actions);
  text.append(titleRow, description); top.append(back, text);
  return { top, actions, update() { const next = translator(lang); backLabel.textContent = next('back'); title.textContent = entry.title[lang]; description.textContent = entry.description[lang]; } };
}
let heading = null;
async function route() {
  const version = ++routeVersion;
  catalogController?.abort(); catalogController = null;
  active?.dispose(); active = null; activeEntry = null; heading = null;
  const id = location.hash.replace(/^#\/?/, '').split('?')[0];
  if (!id || id === 'intermediate') { main.className = 'home'; catalog(id === 'intermediate' ? 'intermediate' : 'basic'); chrome(); return; }
  const entry = demonstrations.find(item => item.id === id);
  main.className = 'demo-page';
  if (!entry) {
    const box = element('section', 'empty-state'); box.append(element('h1', '', translator(lang)('notFound')));
    const back = element('a', 'button primary', translator(lang)('return')); back.href = '#/'; box.append(back); main.replaceChildren(box); chrome(); return;
  }
  activeEntry = entry; heading = demoHeading(entry); const mount = element('div'); const loading = element('p', 'loading', translator(lang)('loading'));
  mount.append(loading); main.replaceChildren(heading.top, mount); chrome();
  try {
    const module = await entry.load();
    if (version !== routeVersion) return;
    mount.replaceChildren(); active = module.mount({ root: mount, lang });
    const quiz = mount.querySelector('.system-quiz');
    if (quiz) heading.actions.append(quiz);
  } catch (error) {
    if (version !== routeVersion) return;
    mount.replaceChildren(element('p', 'empty-state', translator(lang)('failed'))); console.error(error);
  }
}
languageButton.addEventListener('click', () => {
  lang = lang === 'en' ? 'he' : 'en';
  try { localStorage.setItem('physics-language', lang); } catch { /* Optional preference. */ }
  chrome();
  if (active) { heading?.update(); active.setLanguage(lang); }
  else route();
});
window.addEventListener('hashchange', () => { route(); main.focus({ preventScroll: true }); window.scrollTo(0, 0); });
route();
