import { chooseGraphWindow, graphsSideBySide } from './graph-window-layout.js';
import { attachFloatingWindow } from './floating-window.js';
import { element, button, svgElement as s, svgText } from './dom.js';
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
export function createMotionGraphs({ parent, panel, signal, lang, duration, model, time, obstacles = () => [] }) {
  let t = translator(lang), dirty = true, plots = [];
  const controls = element('div', 'graph-controls');
  const toggle = element('label', 'compare-toggle');
  const checkbox = element('input'); checkbox.type = 'checkbox';
  const toggleText = element('span'); toggle.append(checkbox, toggleText);
  controls.append(toggle); panel.append(controls);
  const root = element('section', 'motion-graphs'); root.hidden = true;
  root.setAttribute('aria-label', t('motionGraphs'));
  const header = element('div', 'graph-window-header');
  const heading = button('', 'graph-window-move');
  const expand = button('', 'graph-window-expand');
  const close = button('×', 'graph-window-close'); header.append(heading, expand, close);
  const note = element('p', 'graph-note');
  const tabs = element('div', 'graph-tabs'); tabs.setAttribute('role', 'group');
  const resize = button('↘', 'graph-window-resize');
  const grid = element('div', 'graph-grid'); root.append(header, note, tabs, grid, resize); parent.append(root);
  const dockPlaceholder = element('div', 'graph-dock-placeholder'); dockPlaceholder.hidden = true;
  dockPlaceholder.setAttribute('aria-hidden', 'true'); parent.append(dockPlaceholder);
  const selectedGraphs = new Set([0]);
  const mobileLayout = matchMedia('(max-width: 900px), (max-width: 1000px) and (max-height: 600px) and (orientation: landscape)');
  const landscapeLayout = matchMedia('(orientation: landscape)');
  let expanded = false, previousOverflow, inertNodes = [];
  function labelWindow() {
    expand.textContent = expanded ? `← ${t('graphBack')}` : `⤢ ${t('graphExpand')}`;
    expand.setAttribute('aria-label', t(expanded ? 'graphBack' : 'graphExpand'));
    expand.setAttribute('aria-expanded', String(expanded));
    heading.setAttribute('aria-label', t(mobileLayout.matches ? 'motionGraphs' : 'graphMove'));
  }
  function setExpanded(next, restoreFocus = true) {
    if (expanded === next) return;
    if (next) {
      dockPlaceholder.style.height = `${root.getBoundingClientRect?.().height ?? 220}px`;
    }
    dockPlaceholder.hidden = !next;
    expanded = next;
    root.classList.toggle('is-expanded', expanded);
    root.setAttribute('role', expanded ? 'dialog' : 'region');
    root.setAttribute('aria-modal', String(expanded));
    if (expanded) {
      for (let node = root; node.parentNode; node = node.parentNode) {
        for (const sibling of node.parentNode.children) {
          if (sibling !== node) { inertNodes.push([sibling, sibling.inert]); sibling.inert = true; }
        }
      }
      if (document.body) { previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
      expand.focus({ preventScroll: true });
    } else {
      for (const [node, previous] of inertNodes) node.inert = previous;
      inertNodes = [];
      if (document.body) document.body.style.overflow = previousOverflow;
      if (restoreFocus && !signal.aborted) expand.focus({ preventScroll: true });
    }
    labelWindow(); updateLayout();
  }
  expand.addEventListener('click', () => { if (mobileLayout.matches) setExpanded(!expanded); }, { signal });
  root.addEventListener('keydown', event => {
    if (!expanded) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setExpanded(false); }
    if (event.key === 'Tab') {
      const focusable = [...(heading.disabled ? [] : [heading]), expand, close, ...plots.map(plot => plot.tab)];
      const index = focusable.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); focusable.at(-1).focus(); }
      else if (!event.shiftKey && (index === -1 || index === focusable.length - 1)) { event.preventDefault(); focusable[0].focus(); }
    }
  }, { signal });
  signal.addEventListener('abort', () => setExpanded(false, false), { once: true });
  function updateLayout(width = root.clientWidth) {
    const available = root.clientWidth ?? width ?? 0;
    grid.classList.toggle('is-horizontal', graphsSideBySide(available, selectedGraphs.size)
      || (mobileLayout.matches && selectedGraphs.size > 1 && (landscapeLayout.matches || available >= selectedGraphs.size * 180 + 24)));
  }
  let placementKey = '', placement;
  const floating = attachFloatingWindow({ root, parent, handle: heading, resize, signal,
    onChange: updateLayout, enabled: () => !mobileLayout.matches && !expanded,
    initialGeometry() {
      const bounds = parent.getBoundingClientRect();
      const options = { width: parent.clientWidth ?? bounds.width, height: parent.clientHeight ?? bounds.height,
        count: selectedGraphs.size, obstacles: obstacles() };
      const key = JSON.stringify(options);
      if (key !== placementKey) { placement = chooseGraphWindow(options); placementKey = key; }
      return placement;
    },
  });
  if (globalThis.ResizeObserver) {
    const observer = new ResizeObserver(() => { if (!signal.aborted) updateLayout(); }); observer.observe(root);
    signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  }
  function applyGraphSelection() {
    plots.forEach((plot, i) => {
      plot.card.hidden = !selectedGraphs.has(i);
      plot.tab.setAttribute('aria-pressed', String(selectedGraphs.has(i)));
    });
    root.style.setProperty('--selected-graphs', Math.max(1, selectedGraphs.size));
    updateLayout();
    if (parent.getBoundingClientRect) floating.fit();
  }
  function toggleGraph(index) {
    if (selectedGraphs.has(index)) selectedGraphs.delete(index);
    else selectedGraphs.add(index);
    applyGraphSelection();
  }
  function hide() {
    setExpanded(false, false);
    checkbox.checked = false; root.hidden = true; parent.classList.toggle('has-graphs', false);
    parent.classList.toggle('graphs-docked', false);
    checkbox.focus({ preventScroll: true });
  }
  close.addEventListener('click', hide, { signal });

  function build() {
    plots = []; grid.replaceChildren(); tabs.replaceChildren();
    const end = duration(), config = model();
    note.textContent = t(config.note ?? 'graphNote');
    root.replaceChildren(header, tabs, note);
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
    root.append(grid, resize);
    for (const quantity of config.quantities) {
      const index = plots.length;
      const tab = button('', 'graph-tab');
      const indicator = element('span', 'graph-tab-indicator', '✓'); indicator.setAttribute('aria-hidden', 'true');
      tab.append(indicator, element('span', '', quantity.symbol));
      tab.id = `${root.id || parent.id || 'motion'}-graph-tab-${index}`;
      const card = element('div', 'graph-card'); card.id = `${tab.id}-panel`;
      card.setAttribute('role', 'region'); card.setAttribute('aria-labelledby', tab.id);
      tab.setAttribute('aria-controls', card.id);
      tab.addEventListener('click', () => toggleGraph(index), { signal }); tabs.append(tab);
      const svg = s('svg', { viewBox: '0 0 480 230', role: 'img', 'aria-label': `${quantity.symbol} (${quantity.unit})`, direction: 'ltr' });
      const labelArea = s('foreignObject', { x: 62, y: 0, width: 398, height: 24 }, svg);
      const quantityTitle = element('div', 'graph-quantity-label');
      quantityTitle.append(quantityLabel(quantity.symbol, quantity.unit)); labelArea.append(quantityTitle);
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
      card.append(svg); grid.append(card);
      plots.push({ card, tab, quantity, cursor, dots, x, y });
    }
    applyGraphSelection();
    dirty = false;
  }
  function update(seconds, invalidate = false) {
    dirty ||= invalidate;
    if (!checkbox.checked) return;
    if (dirty) build();
    for (const plot of plots) {
      const values = plot.quantity.sample(seconds);
      plot.cursor.setAttribute('d', `M ${plot.x(seconds)} 24 V 184`);
      plot.dots.forEach((dot, i) => { dot.setAttribute('cx', plot.x(seconds)); dot.setAttribute('cy', plot.y(values[i])); });
    }
  }
  checkbox.addEventListener('change', () => {
    parent.classList.toggle('has-graphs', checkbox.checked);
    root.hidden = !checkbox.checked;
    if (!checkbox.checked) setExpanded(false, false);
    syncMobileLayout(); update(time());
    if (checkbox.checked && parent.getBoundingClientRect) floating.fit();
  }, { signal });
  function setLanguage(lang) {
    t = translator(lang); toggleText.textContent = t('showGraphs'); heading.textContent = t('motionGraphs');
    root.setAttribute('aria-label', t('motionGraphs')); tabs.setAttribute('aria-label', t('graphSelect'));
    labelWindow(); close.setAttribute('aria-label', t('graphClose')); resize.setAttribute('aria-label', t('graphResize'));
    update(time(), true);
  }
  function syncMobileLayout() {
    const leavingExpanded = expanded && !mobileLayout.matches;
    if (!mobileLayout.matches) setExpanded(false, false);
    heading.disabled = mobileLayout.matches;
    root.classList.toggle('is-docked', mobileLayout.matches);
    parent.classList.toggle('graphs-docked', mobileLayout.matches && checkbox.checked);
    expand.hidden = !mobileLayout.matches;
    if (leavingExpanded) checkbox.focus({ preventScroll: true });
    labelWindow(); updateLayout();
    if (parent.getBoundingClientRect) floating.fit();
  }
  mobileLayout.addEventListener?.('change', syncMobileLayout, { signal });
  landscapeLayout.addEventListener?.('change', () => updateLayout(), { signal });
  syncMobileLayout();
  setLanguage(lang);
  return { root, update, setLanguage, fit: floating.fit };
}
