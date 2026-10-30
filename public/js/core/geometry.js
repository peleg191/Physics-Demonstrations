import { svgElement as s, svgText } from './dom.js';

export function geometryLayer(svg) {
  return s('g', { class: 'initial-geometry', 'pointer-events': 'none', direction: 'ltr' }, svg);
}
export function geometryLabel(parent, x, y, text, anchor = 'middle') {
  return svgText(parent, x, y, text, { class: 'geometry-label', 'text-anchor': anchor });
}
// Angles use SVG coordinates: positive angles turn clockwise.
export function angleGuide(parent, x, y, radius, start, end, label, labelX, labelY) {
  const point = angle => [x + radius * Math.cos(angle), y + radius * Math.sin(angle)];
  const [sx, sy] = point(start), [ex, ey] = point(end);
  s('path', { class: 'geometry-guide', d: `M ${sx} ${sy} A ${radius} ${radius} 0 0 ${end >= start ? 1 : 0} ${ex} ${ey}` }, parent);
  geometryLabel(parent, labelX, labelY, label);
}
export function dimensionGuide(parent, x1, y1, x2, y2, label, labelX = (x1 + x2) / 2, labelY = (y1 + y2) / 2 - 10) {
  const length = Math.hypot(x2 - x1, y2 - y1) || 1;
  const tx = -(y2 - y1) / length * 5, ty = (x2 - x1) / length * 5;
  s('path', { class: 'geometry-guide', d: `M ${x1} ${y1} L ${x2} ${y2} M ${x1 - tx} ${y1 - ty} l ${2 * tx} ${2 * ty} M ${x2 - tx} ${y2 - ty} l ${2 * tx} ${2 * ty}` }, parent);
  geometryLabel(parent, labelX, labelY, label);
}
export function showInitialGeometry(layer, time, playing) {
  layer.setAttribute('display', time === 0 && !playing ? 'inline' : 'none');
}
