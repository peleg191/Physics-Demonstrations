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
export function createMotionGraphs({ parent, panel, transport, signal, lang, duration, model, time, seek, obstacles = () => [] }) {
  let t = translator(lang), dirty = true, plots = [];
  const controls = element('div', 'graph-controls');
  const toggle = element('label', 'compare-toggle');
  const checkbox = element('input'); checkbox.type = 'checkbox'; checkbox.checked = false;
  const graphButton = button('', 'button secondary graph-visibility-toggle');
  const icon = s('svg', { viewBox: '0 0 24 24', class: 'transport-icon', 'aria-hidden': 'true', focusable: 'false' });
  s('path', { d: 'M4 3v17h17M7 15l4-6 4 3 5-7', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, icon);
  graphButton.append(icon); transport?.append(graphButton);
  function labelVisibility() {
    const label = t(checkbox.checked ? 'hideGraphs' : 'showGraphs');
    graphButton.setAttribute('aria-label', label);
    graphButton.setAttribute('title', label);
    graphButton.setAttribute('aria-pressed', String(checkbox.checked));
  }
  graphButton.addEventListener('click', () => {
    checkbox.checked = !checkbox.checked;
    syncVisibility();
  }, { signal });
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
      const focusable = [...(heading.disabled ? [] : [heading]), expand, close, ...plots.filter(plot => !plot.card.hidden).map(plot => plot.card), ...plots.map(plot => plot.tab)];
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
    for (const plot of plots) {
      if (plot.card.hidden) continue;
      const width = plot.card.clientWidth, height = plot.card.clientHeight;
      if (!(width > 0 && height > 0)) continue;
      const key = `${width}:${height}`;
      if (plot.size === key) continue;
      plot.size = key;
      plot.draw(width, height);
    }
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
    checkbox.checked = false; syncVisibility();
    (transport ? graphButton : checkbox).focus({ preventScroll: true });
  }
  close.addEventListener('click', hide, { signal });

  function build() {
    plots = []; grid.replaceChildren(); tabs.replaceChildren();
    const end = duration(), config = model();
    note.textContent = `${t(config.note ?? 'graphNote')}${seek ? ` ${t('graphScrubHint')}` : ''}`;
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
      const plot = { card, tab, quantity };
      if (seek) {
        card.tabIndex = 0;
        card.setAttribute('role', 'slider');
        card.setAttribute('aria-label', `${quantity.symbol}: ${t('graphScrub')}`);
        card.setAttribute('aria-valuemin', '0');
        card.setAttribute('aria-valuemax', String(end));
        card.setAttribute('aria-orientation', 'horizontal');
        card.style.touchAction = 'none'; card.style.cursor = 'crosshair';
        let pointer = null;
        function scrub(event) {
          const matrix = plot.svg.getScreenCTM();
          if (!matrix) return;
          const point = plot.svg.createSVGPoint();
          point.x = event.clientX; point.y = event.clientY;
          const local = point.matrixTransform(matrix.inverse());
          seek(end * Math.max(0, Math.min(1, (local.x - plot.left) / plot.plotWidth)));
        }
        card.addEventListener('pointerdown', event => {
          if (event.button !== 0 || pointer !== null) return;
          event.preventDefault(); event.stopPropagation();
          pointer = event.pointerId; card.setPointerCapture(pointer);
          card.focus({ preventScroll: true }); scrub(event);
        }, { signal });
        card.addEventListener('pointermove', event => {
          if (event.pointerId !== pointer) return;
          event.preventDefault(); scrub(event);
        }, { signal });
        const finish = event => {
          if (event.pointerId !== pointer) return;
          if (event.type === 'pointerup') scrub(event);
          const id = pointer; pointer = null;
          if (card.hasPointerCapture(id)) card.releasePointerCapture(id);
        };
        for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) card.addEventListener(type, finish, { signal });
        card.addEventListener('click', event => event.stopPropagation(), { signal });
        card.addEventListener('keydown', event => {
          const step = end / (event.shiftKey ? 20 : 100);
          const target = { ArrowLeft: time() - step, ArrowDown: time() - step,
            ArrowRight: time() + step, ArrowUp: time() + step, Home: 0, End: end }[event.key];
          if (target === undefined) return;
          event.preventDefault(); event.stopPropagation(); seek(target);
        }, { signal });
      }
      plot.draw = (width = 480, height = 230) => {
        const left = Math.min(62, width * 0.22), right = Math.max(left + 1, width - 20);
        const bottom = Math.max(25, height - 46);
        const plotWidth = right - left, plotHeight = bottom - 24;
        const svg = s('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `${quantity.symbol} (${quantity.unit})`, direction: 'ltr' });
        const labelArea = s('foreignObject', { x: left, y: 0, width: plotWidth, height: 24 }, svg);
        const quantityTitle = element('div', 'graph-quantity-label');
        quantityTitle.append(quantityLabel(quantity.symbol, quantity.unit)); labelArea.append(quantityTitle);
        const samples = Array.from({ length: 321 }, (_, i) => quantity.sample(end * i / 320));
        const values = samples.flat();
        let low = Math.min(0, ...values), high = Math.max(0, ...values);
        const padding = (high - low || Math.max(Math.abs(high), 1)) * 0.12;
        low -= padding; high += padding;
        // An onset-only model can have a zero-duration observation.
        const x = time => end > 0 ? left + time / end * plotWidth : left;
        const y = value => bottom - (value - low) / (high - low) * plotHeight;
        for (const level of [low, 0, high]) {
          s('path', { d: `M ${left} ${y(level)} H ${right}`, class: level === 0 ? 'graph-axis' : 'graph-gridline' }, svg);
          svgText(svg, left - 7, y(level) + 4, format(level, 2), { 'text-anchor': 'end' });
        }
        s('path', { d: `M ${left} 24 V ${bottom} H ${right}`, class: 'graph-axis' }, svg);
        for (let i = 0; i <= 4; i++) {
          const seconds = end * i / 4;
          svgText(svg, x(seconds), bottom + 21, format(seconds, 1), { 'text-anchor': 'middle' });
        }
        const timeLabel = svgText(svg, right, height - 6, '', { 'text-anchor': 'end', class: 'graph-time-label' });
        const variable = s('tspan', { 'font-style': 'italic' }, timeLabel); variable.textContent = 't';
        const unit = s('tspan', { 'font-style': 'normal' }, timeLabel); unit.textContent = ' [s]';
        config.components.forEach((component, index) => {
          s('path', { d: samples.map((sample, i) => `${i ? 'L' : 'M'} ${x(end * i / 320)} ${y(sample[index])}`).join(' '), class: `graph-curve graph-series-${index}` }, svg);
        });
        const cursor = s('path', { class: 'graph-cursor' }, svg);
        const dots = config.components.map((_, index) => s('circle', { r: 4, class: `graph-dot graph-series-${index}` }, svg));
        card.replaceChildren(svg);
        Object.assign(plot, { svg, left, plotWidth, cursor, dots, x, y, bottom });
        const seconds = time();
        cursor.setAttribute('d', `M ${x(seconds)} 24 V ${bottom}`);
        const current = quantity.sample(seconds);
        dots.forEach((dot, i) => { dot.setAttribute('cx', x(seconds)); dot.setAttribute('cy', y(current[i])); });
      };
      plot.draw(); grid.append(card);
      plots.push(plot);
    }
    applyGraphSelection();
    dirty = false;
  }
  function update(seconds, invalidate = false) {
    dirty ||= invalidate;
    if (!checkbox.checked) return;
    if (dirty) build();
    for (const plot of plots) {
      if (seek) {
        plot.card.setAttribute('aria-valuenow', String(seconds));
        plot.card.setAttribute('aria-valuetext', `${format(seconds, 2)} s`);
      }
      const values = plot.quantity.sample(seconds);
      plot.cursor.setAttribute('d', `M ${plot.x(seconds)} 24 V ${plot.bottom}`);
      plot.dots.forEach((dot, i) => { dot.setAttribute('cx', plot.x(seconds)); dot.setAttribute('cy', plot.y(values[i])); });
    }
  }
  function syncVisibility() {
    labelVisibility();
    parent.classList.toggle('has-graphs', checkbox.checked);
    root.hidden = !checkbox.checked;
    if (!checkbox.checked) setExpanded(false, false);
    syncMobileLayout(); update(time());
    if (checkbox.checked && parent.getBoundingClientRect) floating.fit();
  }
  checkbox.addEventListener('change', syncVisibility, { signal });
  function setLanguage(lang) {
    t = translator(lang); toggleText.textContent = t('showGraphs'); heading.textContent = t('motionGraphs');
    labelVisibility();
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
