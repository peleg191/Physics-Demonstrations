import { mountBrandMark } from './brand.js';
import { addSketchOutlines } from './sketch.js';
import { resolveIllustrationStyle, illustrationSource } from './presentation.js';

function readPreference(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function preferredLanguage() {
  return readPreference('physics-language') === 'he' ? 'he' : 'en';
}

export function saveLanguage(language) {
  try { localStorage.setItem('physics-language', language); } catch { /* Storage is optional. */ }
}

export function createPresentationControls({ onChange = () => {} } = {}) {
  mountBrandMark();
  let lang = preferredLanguage();
  const savedStyle = readPreference('physics-illustration-style');
  let illustrationStyle = ['current', 'notebook'].includes(savedStyle)
    ? resolveIllustrationStyle(location.search, savedStyle) : resolveIllustrationStyle(location.search);
  document.documentElement.dataset.illustrationStyle = illustrationStyle;
  if (!document.documentElement.dataset.theme) {
    const savedTheme = readPreference('physics-theme');
    document.documentElement.dataset.theme = ['dark', 'light'].includes(savedTheme)
      ? savedTheme : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
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
    styleChrome(); onChange();
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
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#151b17' : '#f3f2ec');
  }
  themeButton.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('physics-theme', theme); } catch { /* Storage is optional. */ }
    themeChrome(); onChange();
  });
  return {
    get style() { return illustrationStyle; },
    update(language) { lang = language; themeChrome(); styleChrome(); },
  };
}
