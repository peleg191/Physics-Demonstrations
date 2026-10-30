import { element, svgElement as s, svgText } from './dom.js';
import { translator, format } from './i18n.js';
import { renderMath, row, identifier, power } from './math.js';

function quantityLabel(symbol, unit) {
  const [base, denominator] = unit.split('/');
  const upright = text => ['mi', { mathvariant: 'normal' }, text];
  const units = denominator
    ? row(upright(base), ['mo', '/'], denominator.endsWith('²') ? power(upright(denominator.slice(0, -1)), 2) : upright(denominator))
    : upright(base);
  return renderMath({ label: `${symbol} [${unit}]`, expression: row(
    identifier(symbol.replace(/\(t\)$/, '')), ['mo', '('], identifier('t'), ['mo', ')'],
    ['mspace', { width: '0.3em' }], ['mo', '['], units, ['mo', ']'],
  ) });
}

export function motionModel(sample, { angular = false, components = ['graphMotion'], note } = {}) {
  return {
    components, note,
    quantities: (angular ? ['θ(t)', 'ω(t)', 'α(t)'] : ['x(t)', 'v(t)', 'a(t)']).map((symbol, index) => ({
      symbol, unit: (angular ? ['rad', 'rad/s', 'rad/s²'] : ['m', 'm/s', 'm/s²'])[index],
      sample: time => sample(time)[index],
    })),
  };
}

// A model supplies SI values at any time; the shared shell owns playback.
export function createMotionGraphs({ parent, panel, signal, lang, duration, model, time }) {
  let t = translator(lang), dirty = true, plots = [];
  const controls = element('div', 'graph-controls');
  const toggle = element('label', 'compare-toggle');
  const checkbox = element('input'); checkbox.type = 'checkbox';
  const toggleText = element('span'); toggle.append(checkbox, toggleText);
  const layoutLabel = element('label', 'graph-layout-control');
  const layoutText = element('span'); const layout = element('select');
  const stacked = element('option'); stacked.value = 'stacked';
  const beside = element('option'); beside.value = 'beside';
  layout.append(stacked, beside); layout.value = 'stacked'; layoutLabel.append(layoutText, layout);
  layoutLabel.hidden = true; controls.append(toggle, layoutLabel); panel.append(controls);
  const root = element('section', 'motion-graphs'); root.hidden = true;
  const heading = element('h2'); const note = element('p', 'graph-note');
  const grid = element('div', 'graph-grid'); root.append(heading, note, grid); parent.append(root);

  function build() {
    plots = []; grid.replaceChildren();
    const end = duration(), config = model();
    note.textContent = t(config.note ?? 'graphNote');
    root.replaceChildren(heading, note);
    if (config.components.length > 1) {
      const legend = element('ul', 'graph-legend');
      legend.setAttribute('aria-label', t('graphLegend'));
      config.components.forEach((component, index) => {
        const item = element('li');
        const swatch = element('span', `graph-legend-swatch graph-series-${index}`);
        swatch.setAttribute('aria-hidden', 'true');
        item.append(swatch, element('span', '', t(component === 'graphHorizontal' ? 'graphHorizontalMotion' : component === 'graphVertical' ? 'graphVerticalMotion' : component)));
        legend.append(item);
      });
      root.append(legend);
    }
    root.append(grid);
    for (const quantity of config.quantities) {
      const card = element('div', 'graph-card');
      const title = element('h3'); title.append(quantityLabel(quantity.symbol, quantity.unit));
      const value = element('p', 'graph-value'); value.dir = 'ltr';
      const svg = s('svg', { viewBox: '0 0 480 230', role: 'img', 'aria-label': `${quantity.symbol} (${quantity.unit})`, direction: 'ltr' });
      const samples = Array.from({ length: 321 }, (_, i) => quantity.sample(end * i / 320));
      const values = samples.flat();
      let low = Math.min(0, ...values), high = Math.max(0, ...values);
      const padding = (high - low || Math.max(Math.abs(high), 1)) * 0.12;
      low -= padding; high += padding;
      const x = time => 62 + time / end * 398;
      const y = value => 184 - (value - low) / (high - low) * 160;
      for (const level of [low, 0, high]) {
        s('path', { d: `M 62 ${y(level)} H 460`, class: level === 0 ? 'graph-axis' : 'graph-gridline' }, svg);
        svgText(svg, 55, y(level) + 4, format(level, 2), { 'text-anchor': 'end' });
      }
      s('path', { d: 'M 62 24 V 184 H 460', class: 'graph-axis' }, svg);
      for (let i = 0; i <= 4; i++) {
        const seconds = end * i / 4;
        svgText(svg, x(seconds), 205, format(seconds, 1), { 'text-anchor': 'middle' });
      }
      const timeLabel = svgText(svg, 460, 224, '', { 'text-anchor': 'end', class: 'graph-time-label' });
      const variable = s('tspan', { 'font-style': 'italic' }, timeLabel); variable.textContent = 't';
      const unit = s('tspan', { 'font-style': 'normal' }, timeLabel); unit.textContent = ' [s]';
      config.components.forEach((component, index) => {
        s('path', { d: samples.map((sample, i) => `${i ? 'L' : 'M'} ${x(end * i / 320)} ${y(sample[index])}`).join(' '), class: `graph-curve graph-series-${index}` }, svg);
      });
      const cursor = s('path', { class: 'graph-cursor' }, svg);
      const dots = config.components.map((_, index) => s('circle', { r: 4, class: `graph-dot graph-series-${index}` }, svg));
      card.append(title);
      card.append(value, svg); grid.append(card);
      plots.push({ quantity, value, cursor, dots, x, y, components: config.components });
    }
    dirty = false;
  }
  function update(seconds, invalidate = false, updateReadouts = true) {
    dirty ||= invalidate;
    if (!checkbox.checked) return;
    if (dirty) build();
    for (const plot of plots) {
      const values = plot.quantity.sample(seconds);
      plot.cursor.setAttribute('d', `M ${plot.x(seconds)} 24 V 184`);
      if (updateReadouts) plot.value.textContent = `${t('time')} ${format(seconds)} s · ` + values.map((value, i) => `${t(plot.components[i])}: ${format(value)} ${plot.quantity.unit}`).join(' · ');
      plot.dots.forEach((dot, i) => { dot.setAttribute('cx', plot.x(seconds)); dot.setAttribute('cy', plot.y(values[i])); });
    }
  }
  checkbox.addEventListener('change', () => {
    parent.classList.toggle('has-graphs', checkbox.checked);
    root.hidden = !checkbox.checked; layoutLabel.hidden = !checkbox.checked; update(time());
  }, { signal });
  layout.addEventListener('change', () => {
    grid.classList.toggle('is-beside', layout.value === 'beside');
    parent.classList.toggle('graphs-beside', layout.value === 'beside');
  }, { signal });
  function setLanguage(lang) {
    t = translator(lang); toggleText.textContent = t('showGraphs'); heading.textContent = t('motionGraphs');
    layoutText.textContent = t('graphLayout'); stacked.textContent = t('graphStacked'); beside.textContent = t('graphBeside');
    update(time(), true);
  }
  setLanguage(lang);
  return { root, update, setLanguage };
}
