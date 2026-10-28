import { demonstrations } from './registry.js';
import { translator } from './core/i18n.js';
import { element } from './core/dom.js';
let lang = 'en';
try { const saved = localStorage.getItem('physics-language'); if (saved === 'he' || saved === 'en') lang = saved; } catch { /* Storage is optional. */ }
let active = null, activeEntry = null, routeVersion = 0;
const main = document.querySelector('#main');
const languageButton = document.querySelector('#language');
function chrome() {
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
  art.innerHTML = '<svg viewBox="0 0 400 260" fill="none"><path d="M35 207H365M90 230V34" stroke="#bec9bf"/><path d="M54 204Q203 -84 340 161" stroke="#658a76" stroke-width="2" stroke-dasharray="4 8"/><circle cx="220" cy="83" r="26" fill="#e5a265"/><path d="M197 71q26 21 45 1m-31-14q-6 25 12 50m-28-21 50 2" stroke="#9b6038" stroke-width="1.5"/><circle cx="339" cy="163" r="5" fill="#214e45"/><path d="M321 206h39m-19-39v39" stroke="#214e45" stroke-width="2"/><circle cx="90" cy="207" r="4" fill="#214e45"/><path d="m91 54 5-13m-14 0 9-7" stroke="#bec9bf"/></svg>';
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
    const image = element('img'); image.src = entry.illustration; image.alt = ''; image.width = 620; image.height = 280;
    const topic = element('span', 'topic-pill', t(entry.topic)); imageArea.append(number, image, topic);
    const content = element('div', 'card-content');
    content.append(element('h3', '', entry.title[lang]), element('p', '', entry.description[lang]));
    const bottom = element('div', 'card-bottom'); const tags = element('div', 'tags');
    for (const tag of entry.tags[lang]) tags.append(element('span', '', tag));
    const arrow = element('span', 'card-arrow', '↗'); arrow.setAttribute('aria-hidden', 'true'); bottom.append(tags, arrow);
    content.append(bottom); card.append(imageArea, content); grid.append(card);
  }
  collection.append(headingRow, grid); main.replaceChildren(hero, collection);
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
