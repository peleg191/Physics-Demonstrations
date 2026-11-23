import { button, element, setText, svgElement } from './dom.js';
import { format } from './i18n.js';
import { markDiagramTerm } from './analysis-highlights.js';

const entries = [
  { key: 'elastic', icon: 'M3 20V7m0 7h4l2-5 3 10 3-10 3 10 2-5h4m0-5h7v10h-7z' },
  { key: 'kinetic', icon: 'M16 9h11v11H16zM4 10h8m-10 5h9m-5 5h6' },
  { key: 'gravitational', icon: 'M2 24h9l20-10v10H11m10-10v-7h8v7m-24 5V7m-3 3 3-3 3 3' },
];

export const energyTransferBounds = { left: 26, top: 92, width: 256, height: 332 };

const labels = {
  en: { title: 'Energy transfer', show: 'Show energy transfer', hide: 'Hide energy transfer', elastic: 'Spring energy', kinetic: 'Kinetic energy',
    gravitational: 'Gravitational energy', gravity: 'Gravity', total: 'Mechanical energy' },
  he: { title: 'המרת אנרגיה', show: 'הצגת המרת אנרגיה', hide: 'הסתרת המרת אנרגיה', elastic: 'אנרגיית קפיץ', kinetic: 'אנרגיה קינטית',
    gravitational: 'אנרגיית גובה', gravity: 'כבידה', total: 'אנרגיה מכנית' },
};

export function createEnergyTransfer({ api, id, lang, elastic = false, gravitational = true, signed = false,
  bounds = energyTransferBounds, initiallyVisible = true, onVisibilityChange }) {
  const { left, top, width, height } = bounds;
  const surface = svgElement('foreignObject', { x: left, y: top, width, height, 'pointer-events': 'none' }, api.svg);
  const root = element('section', 'energy-panel energy-transfer');
  const header = element('header', 'energy-transfer-header');
  root.id = `${id}-energy-transfer`;
  if (signed) root.className += ' energy-transfer-signed';
  const title = element('h3'); title.id = `${root.id}-title`;
  root.setAttribute('aria-labelledby', title.id);
  const total = element('span', 'energy-transfer-total');
  markDiagramTerm(total, 'Ei', 'Ef');
  const totalLabel = element('span');
  const totalValue = element('strong'); totalValue.dir = 'ltr';
  total.append(totalLabel, totalValue);
  header.append(title);
  const flow = element('div', 'energy-transfer-flow');
  const enabled = { elastic, kinetic: true, gravitational };
  const readings = entries.filter(({ key }) => enabled[key]).map(({ key, icon }) => {
    const column = element('div', `energy-transfer-column energy-transfer-${key}`);
    if (key === 'elastic') markDiagramTerm(column, 'EA');
    if (key === 'kinetic') markDiagramTerm(column, 'EB');
    if (key === 'gravitational') markDiagramTerm(column, 'EC', 'U', 'mgh');
    const diagram = svgElement('svg', { viewBox: '0 0 34 29', 'aria-hidden': 'true', class: 'energy-transfer-icon' });
    svgElement('path', { d: icon, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, diagram);
    const vessel = element('div', 'energy-transfer-vessel');
    vessel.setAttribute('aria-hidden', 'true');
    const fill = element('div', 'energy-transfer-fill');
    vessel.append(fill);
    const label = element('span', 'energy-transfer-label');
    const value = element('span', 'energy-transfer-value'); value.dir = 'ltr';
    const heading = element('div', 'energy-transfer-row-heading');
    heading.append(diagram, label);
    column.append(heading, value, vessel);
    flow.append(column);
    return { key: key === 'gravitational' && !elastic ? 'potential' : key, labelKey: key, fill, label, value };
  });
  if (signed) {
    const scale = element('div', 'energy-transfer-axis');
    scale.dir = 'ltr'; scale.setAttribute('aria-hidden', 'true');
    for (const tick of ['−', '0', '+']) scale.append(element('span', '', tick));
    root.append(header, scale, flow, total);
  } else root.append(header, flow, total);
  surface.append(root);

  const toggle = element('label', 'compare-toggle energy-transfer-toggle');
  const checkbox = element('input'); checkbox.type = 'checkbox'; checkbox.checked = initiallyVisible;
  checkbox.id = `${id}-show-energy-transfer`;
  checkbox.setAttribute('aria-controls', root.id);
  const toggleText = element('span');
  toggle.append(checkbox, toggleText); api.parameters.append(toggle);
  const visibilityButton = button('', 'button secondary energy-visibility-toggle');
  visibilityButton.setAttribute('aria-controls', root.id);
  const icon = svgElement('svg', { viewBox: '0 0 24 24', class: 'transport-icon', 'aria-hidden': 'true', focusable: 'false' });
  svgElement('path', { d: 'M3 5h18v14H3z M7 9h6 M7 12h10 M7 15h4', fill: 'none',
    stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, icon);
  visibilityButton.append(icon); api.transport.append(visibilityButton);

  let language = lang;
  function labelVisibility() {
    const label = labels[language][checkbox.checked ? 'hide' : 'show'];
    visibilityButton.setAttribute('aria-label', label);
    visibilityButton.setAttribute('title', label);
    visibilityButton.setAttribute('aria-pressed', String(checkbox.checked));
  }
  function syncVisibility() {
    surface.setAttribute('display', checkbox.checked ? 'inline' : 'none');
    labelVisibility();
  }
  function changeVisibility() {
    syncVisibility();
    onVisibilityChange();
  }
  checkbox.addEventListener('change', changeVisibility, { signal: api.signal });
  visibilityButton.addEventListener('click', () => {
    checkbox.checked = !checkbox.checked;
    changeVisibility();
  }, { signal: api.signal });

  function setLanguage(next) {
    language = next;
    const words = labels[language];
    root.dir = language === 'he' ? 'rtl' : 'ltr';
    setText(title, words.title);
    setText(totalLabel, words.total);
    setText(toggleText, words.show);
    for (const { labelKey, label } of readings) setText(label, words[signed && labelKey === 'gravitational' ? 'gravity' : labelKey]);
    labelVisibility();
  }
  const reading = value => `${format(signed ? value / 1e6 : value)} ${signed ? 'MJ' : 'J'}`;
  setLanguage(lang);
  syncVisibility();
  return { get visible() { return checkbox.checked; }, setLanguage, update(state, { updateReadouts = true, scale = state.total } = {}) {
    if (!checkbox.checked) return;
    for (const { key, fill, value } of readings) {
      const amount = state[key];
      const fraction = scale > 0 ? Math.min(1, Math.abs(amount) / scale) : 0;
      fill.style.setProperty('--energy-fraction', fraction);
      if (signed) fill.style.setProperty('--energy-direction', amount < 0 ? -1 : 1);
      if (updateReadouts) setText(value, reading(amount));
    }
    if (updateReadouts) setText(totalValue, reading(state.total));
  } };
}
