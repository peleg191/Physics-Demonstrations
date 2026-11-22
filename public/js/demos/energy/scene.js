import { svgElement as s, svgText, setText } from '../../core/dom.js';

const edge = 'var(--scene-edge, #476b60)';
const surface = 'var(--scene-surface, #e5e7d9)';
const warm = 'var(--scene-warm, #c38e60)';
const muted = 'var(--scene-muted, #9ca79c)';

export function createScene(svg, kind) {
  const space = kind === 'escape-speed';
  const incline = kind === 'energy-incline';
  const scenery = s('g', { class: 'energy-scenery', 'aria-hidden': 'true', 'pointer-events': 'none' }, svg);
  if (space) {
    s('path', { class: 'energy-orbit', d: 'M380 151a89 89 0 1 1 0 178a89 89 0 1 1 0-178' }, scenery);
    s('path', { class: 'energy-stars', d: 'M495 133v14m-7-7h14m55 62v8m-4-4h8m62-65v12m-6-6h12m79 44v9m-4.5-4.5h9m-145 116v12m-6-6h12m121 3v10m-5-5h10' }, scenery);
  }
  const track = space
    ? s('circle', { cx: 380, cy: 240, r: 66, class: 'energy-planet', stroke: edge, 'stroke-width': 2.5 }, scenery)
    : s('path', { class: 'energy-track', fill: surface, stroke: edge, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'data-sketch-dynamic': 'true' }, scenery);
  let marsTerrain, earthTerrain;
  if (space) {
    marsTerrain = s('g', { class: 'energy-mars-terrain' }, scenery);
    s('path', { d: 'M325 229q22-22 50-11t55-8m-105 46q20-19 42-8t55 4m-76 29q21-8 38-2t25-3' }, marsTerrain);
    for (const [cx, cy, rx, ry] of [[365, 199, 10, 5], [414, 229, 13, 7], [355, 267, 7, 4]]) {
      s('ellipse', { cx, cy, rx, ry }, marsTerrain);
    }
    earthTerrain = s('g', { class: 'energy-earth-terrain' }, scenery);
    s('path', { d: 'M333 212l15-14 21-6 17 12-7 11-14 3-3 11-15 4-9-8z M367 239l13-6 14 9-3 15-10 9-6 15-8-11 2-15-8-8z M403 201l18 3 13 18-11 5-8-7-18-7z M412 245l11 8-1 13-13 9-9-7 4-14z' }, earthTerrain);
  }
  const guide = s('path', { class: 'energy-guide', fill: 'none', stroke: muted, 'stroke-width': 1.6, 'stroke-dasharray': '5 5' }, scenery);
  const trim = s('path', { class: 'energy-track-trim', 'data-sketch-dynamic': 'true' }, scenery);
  const detail = s('path', { class: 'energy-track-detail', 'data-sketch-dynamic': 'true' }, scenery);
  const spring = !space && !incline ? s('path', { class: 'energy-spring-coil', 'data-sketch-dynamic': 'true' }, scenery) : null;
  const label = svgText(svg, 0, 0, '', { class: 'energy-scene-label', 'text-anchor': 'middle' });
  const mass = s('g', { class: 'selectable-mass', role: 'button', tabindex: 0 }, svg);
  s('rect', { x: -27, y: -28, width: 54, height: 56, fill: 'transparent' }, mass);
  if (space) {
    s('path', { class: 'mass-body energy-spacecraft', d: 'M-16-7h17q12 0 22 7Q13 7 1 7h-17l-5-3v-8z', fill: warm, stroke: edge, 'stroke-width': 2 }, mass);
    s('path', { class: 'energy-spacecraft-fin', d: 'M-12-7l-7-8h8l10 8m-11 14-7 8h8l10-8m-20-10h-6v6h6' }, mass);
    s('circle', { class: 'energy-spacecraft-window', cx: 6, cy: 0, r: 3 }, mass);
  } else {
    s('rect', { class: 'mass-body', x: -16, y: -32, width: 32, height: 32, rx: 5, fill: warm, stroke: edge, 'stroke-width': 2 }, mass);
    s('path', { class: 'energy-block-bevel', d: 'M-10-26H10M-10-5H10' }, mass);
    svgText(mass, 0, -10, 'm', { class: 'mass-text energy-mass-text', 'text-anchor': 'middle' });
  }

  let project, rampX, angle, springStart, coilY, scale, compression;
  function layout(params, model, words) {
    if (space) {
      const mars = params.planet === 'mars';
      track.setAttribute('fill', mars ? warm : 'var(--energy-ocean)');
      marsTerrain.setAttribute('display', mars ? 'inline' : 'none');
      earthTerrain.setAttribute('display', mars ? 'none' : 'inline');
      guide.setAttribute('d', 'M 380 240 H 710');
      detail.setAttribute('d', 'M446 234v12m66-10v8m66-8v8m66-8v8m66-10v12');
      label.setAttribute('x', 380); label.setAttribute('y', 350);
      setText(label, words[params.planet]);
      project = radius => [380 + 66 * radius / model.radius, 240];
      return;
    }
    angle = params.angle;
    compression = params.compression;
    const slope = Math.tan(model.alpha);
    const rise = incline ? params.height : model.height + 0.4;
    const run = rise / slope;
    const flat = incline ? 0 : 2.5;
    const drawingWidth = 421;
    const center = 540;
    scale = Math.min(drawingWidth / (run + flat), 238 / rise, 165);
    const start = center - (run + flat) * scale / 2;
    const base = incline ? 365 : Math.max(290, 246 + rise * scale / 2);
    project = (x, y) => [start + scale * x, base - scale * y];
    rampX = start + flat * scale;
    const endX = rampX + run * scale, top = base - rise * scale;
    if (incline) {
      track.setAttribute('d', `M ${start} ${top} L ${endX} ${base} H ${start} Z`);
      guide.setAttribute('d', `M ${start - 24} ${top} V ${base}`);
      trim.setAttribute('d', `M ${start} ${top} L ${endX} ${base} H ${endX + 19}`);
      const dimensionX = start - 24;
      detail.setAttribute('d', `M ${dimensionX - 6} ${top} h 20 M ${dimensionX - 6} ${base} h 20 M ${start - 12} ${base + 12} H ${endX + 19}`);
      label.setAttribute('x', start + 10); label.setAttribute('text-anchor', 'start'); label.setAttribute('y', (top + base) / 2 - 10);
      setText(label, `h = ${params.height} m`);
    } else {
      springStart = start;
      coilY = base - 16;
      track.setAttribute('d', `M ${start - 16} ${base} H ${rampX} L ${endX} ${top} V ${base + 12} H ${start - 16} Z`);
      guide.setAttribute('d', `M ${rampX} ${base} h 48`);
      trim.setAttribute('d', `M ${start - 16} ${base} H ${rampX} L ${endX} ${top}`);
      detail.setAttribute('d', `M ${start} ${base} v -45 m 0 6 -12 7 m 12 4 -12 7 m 12 4 -12 7 M ${rampX + 31} ${base} a 31 31 0 0 0 ${31 * (Math.cos(model.alpha) - 1)} ${-31 * Math.sin(model.alpha)}`);
      label.setAttribute('x', rampX + 33); label.setAttribute('y', base + 38);
      setText(label, `α = ${angle}°`);
    }
  }

  function update(state) {
    const [x, y] = space ? project(state.position) : project(state.x + (incline ? 0 : 1.5 - compression), state.y);
    const tilt = space ? 0 : incline ? angle : x >= rampX && state.y > 0 ? -angle : 0;
    mass.setAttribute('transform', `translate(${x} ${y}) rotate(${tilt})`);
    if (spring) {
      const tip = springStart + (1.5 - state.remaining) * scale;
      const width = tip - springStart;
      const coils = Array.from({ length: 10 }, (_, i) => {
        const pitch = width / 10;
        return `q ${pitch / 2} ${i % 2 ? 16 : -16} ${pitch} 0`;
      });
      spring.setAttribute('d', `M ${springStart} ${coilY} ${coils.join(' ')}`);
    }
  }
  return { mass, update, layout };
}
