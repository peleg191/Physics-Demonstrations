import { addSketchOutlines, prepareSketchOutlines } from './core/sketch.js';
import { resolveIllustrationStyle, illustrationSource } from './core/presentation.js';
import { demonstrations } from './registry.js';
import { translator } from './core/i18n.js';
import { element } from './core/dom.js';
let savedStyle;
try { savedStyle = localStorage.getItem('physics-illustration-style'); } catch { /* Storage is optional. */ }
let illustrationStyle = ['current', 'notebook'].includes(savedStyle)
  ? resolveIllustrationStyle(location.search, savedStyle) : resolveIllustrationStyle(location.search);
document.documentElement.dataset.illustrationStyle = illustrationStyle;
let lang = 'en';
try { const saved = localStorage.getItem('physics-language'); if (saved === 'he' || saved === 'en') lang = saved; } catch { /* Storage is optional. */ }
let active = null, activeEntry = null, routeVersion = 0;
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
  for (const image of document.querySelectorAll('img[data-illustration]')) image.src = illustrationSource(image.dataset.illustration, illustrationStyle);
  for (const scene of document.querySelectorAll('.system-svg, .hero-art')) addSketchOutlines(scene);
  styleChrome();
});
function themeChrome() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeButton.setAttribute('aria-pressed', String(dark));
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
function catalog() {
  const t = translator(lang);
  const hero = element('section', 'hero');
  const copy = element('div', 'hero-copy'); copy.append(element('p', 'eyebrow', t('eyebrow')));
  const heading = element('h1'); heading.append(document.createTextNode(t('hero')), element('span', 'hero-accent', t('heroAccent')));
  copy.append(heading, element('p', 'hero-intro', t('intro')));
  const art = element('div', 'hero-art'); art.setAttribute('aria-hidden', 'true');
  art.innerHTML = `<svg viewBox="0 0 400 280" fill="none" focusable="false">
    <defs><pattern id="hero-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="var(--muted)" opacity=".2"/></pattern></defs>
    <rect x="10" y="10" width="380" height="260" rx="20" fill="url(#hero-grid)"/>
    <g stroke="var(--muted)" stroke-width="1.5" opacity=".5"><path d="M30 148h172M42 148V34M30 250h340"/><path d="m196 144 6 4-6 4M38 40l4-6 4 6"/></g>
    <path d="M43 143Q111 -40 196 125" stroke="var(--green)" stroke-width="2.5" stroke-dasharray="5 7"/>
    <circle cx="123" cy="55" r="16" fill="var(--orange)" stroke="var(--ink)" stroke-width="1.5"/>
    <path d="M108 52q15 10 29 0m-16-12q-6 17 5 30" stroke="var(--ink)" stroke-width="1.2"/>
    <g stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M250 35h100m-80 0-7-9m27 9-7-9m27 9-7-9m27 9-7-9"/>
      <path d="M297 36v106" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 6"/>
      <path d="M297 36l42 98"/>
      <path d="M253 134a108 108 0 0 0 86 0" stroke="var(--green)" stroke-width="1.5" stroke-dasharray="4 6"/>
      <circle cx="339" cy="134" r="17" fill="var(--green)"/>
      <circle cx="297" cy="36" r="4" fill="var(--ink)"/>
      <path d="M53 198v52m-9-44 9-8m-9 24 9-8m-9 24 9-8M54 225h15l7-14 12 28 12-28 12 28 12-28 12 28 7-14h18"/>
      <rect x="161" y="201" width="47" height="47" rx="5" fill="var(--orange)"/>
      <path d="M229 225h64m-7-5 7 5-7 5" stroke="var(--green)"/>
    </g>
    <path d="M316 222q8-25 16 0t16 0t16 0" stroke="var(--green)" stroke-width="2"/>
  </svg>`;
  const count = element('p', 'experiment-count'); count.append(element('strong', '', String(demonstrations.length).padStart(2, '0')), document.createTextNode(t('count')));
  hero.append(copy, art, count);
  const collection = element('section', 'collection');
  collection.setAttribute('aria-labelledby', 'collection-heading');
  const headingRow = element('div', 'collection-heading');
  const collectionTitle = element('h2', '', t('collectionTitle')); collectionTitle.id = 'collection-heading';
  headingRow.append(collectionTitle, element('p', '', t('collectionNote')));
  const grid = element('div', 'catalog-grid');
  for (const entry of demonstrations) {
    const card = element('a', `experiment-card ${entry.id}`); card.href = `#/${entry.id}`;
    const imageArea = element('div', 'card-image'); const number = element('span', 'card-number', entry.number);
    const image = element('img'); image.dataset.illustration = entry.illustration; image.src = illustrationSource(entry.illustration, illustrationStyle); image.alt = ''; image.width = 620; image.height = 280;
    const topic = element('span', 'topic-pill', t(entry.topic)); imageArea.append(number, image, topic);
    const content = element('div', 'card-content');
    content.append(element('h3', '', entry.title[lang]), element('p', '', entry.description[lang]));
    const bottom = element('div', 'card-bottom'); const tags = element('div', 'tags');
    for (const tag of entry.tags[lang]) tags.append(element('span', '', tag));
    const arrow = element('span', 'card-arrow', '↗'); arrow.setAttribute('aria-hidden', 'true'); bottom.append(tags, arrow);
    content.append(bottom); card.append(imageArea, content); grid.append(card);
  }
  collection.append(headingRow, grid); main.replaceChildren(hero, collection); prepareSketchOutlines(art);
}
function demoHeading(entry) {
  const t = translator(lang); const top = element('div', 'demo-heading');
  const back = element('a', 'back-link', `← ${t('back')}`); back.href = '#/';
  const text = element('div', 'demo-heading-copy');
  const eyebrow = element('p', 'eyebrow', `${t('experiment')} / ${entry.number}`);
  const title = element('h1', '', entry.title[lang]); const description = element('p', 'demo-description', entry.description[lang]);
  text.append(eyebrow, title, description); top.append(back, text);
  return { top, update() { const next = translator(lang); back.textContent = `← ${next('back')}`; eyebrow.textContent = `${next('experiment')} / ${entry.number}`; title.textContent = entry.title[lang]; description.textContent = entry.description[lang]; } };
}
let heading = null;
async function route() {
  const version = ++routeVersion;
  active?.dispose(); active = null; activeEntry = null; heading = null;
  const id = location.hash.replace(/^#\/?/, '').split('?')[0];
  if (!id) { main.className = 'home'; catalog(); chrome(); return; }
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
