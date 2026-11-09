import { element, setText } from './dom.js';
import { format } from './i18n.js';
import { row, renderMath } from './math.js';
import { latexExpression } from './latex.js';

// Values are joules; visible labels are mathematical, with localized accessible descriptions.
export function createEnergyBar({ parent, words }) {
  const root = element('section', 'energy-panel');
  const symbols = { kinetic: 'E_k', potential: 'E_g', total: 'E_{\\mathrm{tot}}' };
  const term = key => ['mstyle', { class: `energy-${key}-symbol` }, latexExpression(symbols[key])];
  const bar = element('div', 'energy-bar'); bar.setAttribute('role', 'img'); bar.dir = 'ltr';
  const potential = element('div', 'energy-segment energy-potential'), kinetic = element('div', 'energy-segment energy-kinetic');
  bar.style.setProperty('display', 'flex'); bar.style.setProperty('height', '30px');
  for (const [segment, color] of [[potential, 'var(--energy-potential, #c38e60)'], [kinetic, 'var(--energy-kinetic, #61816b)']]) {
    segment.style.setProperty('height', '100%'); segment.style.setProperty('flex', 'none'); segment.style.setProperty('background-color', color);
  }
  potential.setAttribute('aria-hidden', 'true'); kinetic.setAttribute('aria-hidden', 'true'); bar.append(kinetic, potential);
  const legend = element('div', 'energy-legend'); legend.dir = 'ltr';
  const entries = ['kinetic', 'potential', 'total'].map(key => {
    const reading = element('div', `energy-reading energy-${key}-reading`);
    const math = renderMath({ label: `${symbols[key]} = 0 J`, expression: row(term(key), ['mo', '='], ['mn', '0.00'], ['mtext', ' J']) });
    math.setAttribute('display', 'inline');
    const value = math.children[0].children[2];
    reading.append(math); legend.append(reading); return { key, value, math };
  });
  root.append(legend, bar); parent.append(root);
  return { root, setLanguage(next) { words = next; }, update(state, { updateReadouts = true } = {}) {
    const fraction = state.total > 0 ? Math.max(0, Math.min(1, state.potential / state.total)) : 0;
    potential.style.setProperty('width', `${100 * fraction}%`); kinetic.style.setProperty('width', `${100 * (1 - fraction)}%`);
    if (!updateReadouts) return;
    for (const entry of entries) {
      const value = format(state[entry.key]); setText(entry.value, value);
      entry.math.setAttribute('aria-label', `${entry.key === 'kinetic' ? 'E_k' : entry.key === 'potential' ? 'E_g' : 'E_tot'} = ${value} J`);
    }
    bar.setAttribute('aria-label', `${words.potential}: ${format(state.potential)} J; ${words.kinetic}: ${format(state.kinetic)} J; ${words.total}: ${format(state.total)} J`);
  } };
}
