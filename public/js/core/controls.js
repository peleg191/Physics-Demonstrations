import { element } from './dom.js';
import { format } from './i18n.js';
export function parameter({ id, label, unit, min, max, step, value, onChange, signal }) {
  let currentValue = value;
  const root = element('div', 'parameter');
  const top = element('div', 'parameter-top');
  const text = element('label', '', label); text.htmlFor = id;
  const field = element('div', 'number-field');
  const number = element('input');
  Object.assign(number, { type: 'number', id, min: String(min), max: String(max), step: String(step), value: String(value) });
  number.setAttribute('aria-label', `${label} (${unit})`);
  const suffix = element('span', 'unit', unit);
  const range = element('input', 'range');
  Object.assign(range, { type: 'range', min: String(min), max: String(max), step: String(step), value: String(value) });
  range.setAttribute('aria-label', `${label} (${unit})`);
  function update(v) {
    currentValue = v; number.value = String(v); range.value = String(v);
    range.style.setProperty('--fill', `${(v - min) / (max - min) * 100}%`);
  }
  function normalize(v) {
    const clamped = Math.max(min, Math.min(max, v));
    return Number((Math.round((clamped - min) / step) * step + min).toFixed(6));
  }
  range.addEventListener('input', () => { const v = Number(range.value); update(v); onChange(v); }, { signal });
  number.addEventListener('change', () => {
    if (number.value.trim() === '' || !Number.isFinite(number.valueAsNumber)) { update(currentValue); return; }
    const v = normalize(number.valueAsNumber); update(v); onChange(v);
  }, { signal });
  field.append(number, suffix); top.append(text, field); root.append(top, range); update(value);
  return { root, update, localize(nextLabel, nextUnit) { text.textContent = nextLabel; suffix.textContent = nextUnit; number.setAttribute('aria-label', `${nextLabel} (${nextUnit})`); range.setAttribute('aria-label', `${nextLabel} (${nextUnit})`); } };
}
export function metric(label, unit) {
  const root = element('div', 'metric');
  const title = element('span', 'metric-label', label);
  const value = element('span', 'metric-value'); value.dir = 'ltr';
  const number = element('span', '', '0.00'); const suffix = element('small', '', unit);
  value.append(number, suffix); root.append(title, value);
  return { root, set(v, digits = 2) { number.textContent = format(v, digits); }, localize(text, nextUnit) { title.textContent = text; suffix.textContent = nextUnit; } };
}
