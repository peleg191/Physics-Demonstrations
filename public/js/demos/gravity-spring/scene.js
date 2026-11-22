import { setText, svgElement as s, svgText } from '../../core/dom.js';
import { format } from '../../core/i18n.js';

const scale = 64;
const naturalCenter = 115;
const halfBlock = 23;
const muted = 'var(--scene-muted, #9caa91)';
const accent = 'var(--scene-force-applied, #9a642e)';
const structure = 'var(--scene-structure, #839775)';

export function createGravitySpringScene(svg, inclined) {
  const origin = inclined ? [235, 103] : [400, 46];
  const plane = inclined ? s('path', { class: 'incline-surface', fill: 'var(--scene-surface, #dce3d1)', stroke: structure, 'stroke-width': 3 }, svg) : null;
  const track = s('g', {}, svg);
  s('path', { d: 'M 0 -45 V 23 M -7 -45 V 23', stroke: structure, 'stroke-width': 4 }, track);
  const spring = s('path', { fill: 'none', stroke: 'var(--scene-green, #6f8e65)', 'stroke-width': 3 }, track);
  const markers = s('g', { 'pointer-events': 'none' }, svg);
  const natural = s('path', { fill: 'none', stroke: muted, 'stroke-width': 2, 'stroke-dasharray': '5 4' }, markers);
  const equilibrium = s('path', { fill: 'none', stroke: accent, 'stroke-width': 3 }, markers);
  const dot = s('circle', { r: 5, fill: accent }, markers);
  const naturalLabel = svgText(markers, 0, 0, '', { class: 'spring-reference-label', 'text-anchor': inclined ? 'middle' : 'end' });
  const equilibriumLabel = svgText(markers, 0, 0, '', { class: 'spring-reference-label spring-equilibrium-label', 'text-anchor': inclined ? 'middle' : 'start' });
  const shiftLabel = svgText(markers, 0, 0, '', { class: 'spring-reference-label spring-equilibrium-label', 'text-anchor': inclined ? 'middle' : 'start', direction: 'ltr' });

  function basis(params) {
    const angle = inclined ? params.angle : 90;
    const radians = angle * Math.PI / 180;
    return { angle, ux: Math.cos(radians), uy: Math.sin(radians) };
  }
  function coordinates(along, normal, { ux, uy }) {
    return [origin[0] + along * ux - normal * uy, origin[1] + along * uy + normal * ux];
  }
  function bodyPosition(params, state) {
    return coordinates(naturalCenter + state.extension * scale, 0, basis(params));
  }
  function displacement(params, state, x, y) {
    const { ux, uy } = basis(params);
    return ((x - origin[0]) * ux + (y - origin[1]) * uy - naturalCenter) / scale - state.shift;
  }
  function placeLabel(node, [x, y], text) {
    node.setAttribute('x', x); node.setAttribute('y', y); setText(node, text);
  }
  function render(params, state, words) {
    const axes = basis(params);
    const point = (along, normal) => coordinates(along, normal, axes);
    const pair = (along, normal) => point(along, normal).join(' ');
    track.setAttribute('transform', `translate(${origin.join(' ')}) rotate(${axes.angle})`);
    if (plane) {
      const [left, top] = point(-10, halfBlock);
      const [right, bottom] = point(415, halfBlock);
      plane.setAttribute('d', `M ${left} ${top} L ${right} ${bottom} v 16 H ${left} Z`);
    }
    const end = naturalCenter + state.extension * scale - halfBlock;
    const points = ['M 0 0 H 9'];
    for (let n = 0; n <= 20; n++) {
      points.push(`L ${9 + (end - 18) * n / 20} ${n === 0 || n === 20 ? 0 : n % 2 ? -10 : 10}`);
    }
    points.push(`H ${end}`);
    spring.setAttribute('d', points.join(' '));

    const center = naturalCenter + state.shift * scale;
    // On the incline the natural-length label stays by the support, while
    // equilibrium gets a separate lane above the track, including at 0°.
    const naturalEnd = inclined ? point(naturalCenter, 41) : point(naturalCenter, 51);
    natural.setAttribute('d', `M ${pair(naturalCenter, inclined ? 19 : 0)} L ${naturalEnd.join(' ')}`);
    const markerSide = inclined ? -49 : -63;
    equilibrium.setAttribute('d', `M ${pair(center, 0)} L ${pair(center, markerSide)}`);
    const [ex, ey] = point(center, markerSide);
    dot.setAttribute('cx', ex); dot.setAttribute('cy', ey);
    placeLabel(naturalLabel, [naturalEnd[0] + (inclined ? 0 : -8), naturalEnd[1] + (inclined ? 24 : 5)], words.naturalLength);
    const labelX = ex + (inclined ? 0 : 12);
    const labelY = ey - (inclined ? 29 : 5);
    placeLabel(equilibriumLabel, [labelX, labelY], words.equilibrium);
    placeLabel(shiftLabel, [labelX, labelY + 20], `ΔL = ${format(state.shift)} m`);

    const [x, y] = bodyPosition(params, state);
    const restoring = -state.position / 0.75 * 75;
    return { x, y, angle: inclined ? axes.angle : 0, dx: restoring * axes.ux, dy: restoring * axes.uy,
      forceLabel: point(naturalCenter + state.extension * scale + restoring / 2, inclined ? -35 : 42) };
  }
  return { bodyPosition, displacement, render };
}
