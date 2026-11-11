import { presentationConfig } from '../config.js';

// A query override makes art direction reviewable without changing the default.
export function resolveIllustrationStyle(search = '', fallback = presentationConfig.illustrationStyle) {
  const requested = new URLSearchParams(search).get('style');
  return (requested || fallback) === 'notebook' ? 'notebook' : 'current';
}
export function illustrationSource(source, style, theme = 'light') {
  const illustration = style === 'notebook' ? source.replace(/([^/]+)\.svg$/, 'notebook/$1.svg') : source;
  return theme === 'dark' ? illustration.replace(/([^/]+)\.svg$/, 'dark/$1.svg') : illustration;
}
