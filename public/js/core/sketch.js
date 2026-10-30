import { svgElement } from './dom.js';

// Fixed geometry: no noise filters, animation hooks, or per-frame sampling.
export function pencilPath(points) {
  if (points.length < 2) return '';
  return points.map(([x, y], index) => {
    const edge = index === 0 || index === points.length - 1;
    const offsetX = edge ? 0 : Math.sin(index * 2.17) * 0.45;
    const offsetY = edge ? 0 : Math.cos(index * 1.73) * 0.45;
    return `${index ? 'L' : 'M'} ${(x + offsetX).toFixed(2)} ${(y + offsetY).toFixed(2)}`;
  }).join(' ');
}
function outlinePoints(node) {
  const number = (name, fallback = 0) => Number(node.getAttribute(name) ?? fallback);
  const tag = node.tagName.toLowerCase();
  if (tag === 'circle' || tag === 'ellipse') {
    const cx = number('cx'), cy = number('cy'), rx = number(tag === 'circle' ? 'r' : 'rx'), ry = number(tag === 'circle' ? 'r' : 'ry');
    if (rx < 4 || ry < 4) return [];
    return Array.from({ length: 49 }, (_, i) => [cx + rx * Math.cos(i / 48 * 2 * Math.PI), cy + ry * Math.sin(i / 48 * 2 * Math.PI)]);
  }
  // The browser samples authored curves only during scene creation. Disjoint
  // paths stay authored to avoid joining separate strokes with spurious lines.
  if (tag === 'path' && node.getAttribute('d') && (node.getAttribute('d').match(/[mM]/g) || []).length === 1 && node.getTotalLength) {
    const length = node.getTotalLength();
    const count = Math.min(120, Math.max(2, Math.ceil(length / 7)));
    return Array.from({ length: count + 1 }, (_, i) => {
      const point = node.getPointAtLength(length * i / count);
      return [point.x, point.y];
    });
  }
  if (tag === 'rect') {
    const x = number('x'), y = number('y'), w = number('width'), h = number('height');
    if (w < 4 || h < 4 || w > 300 || h > 300) return [];
    const radius = Math.min(number('rx'), w / 2, h / 2);
    const points = [];
    for (const [cx, cy, angle] of [[x + w - radius, y + radius, -Math.PI / 2], [x + w - radius, y + h - radius, 0], [x + radius, y + h - radius, Math.PI / 2], [x + radius, y + radius, Math.PI]]) {
      for (let i = 0; i <= 6; i++) points.push([cx + radius * Math.cos(angle + i / 6 * Math.PI / 2), cy + radius * Math.sin(angle + i / 6 * Math.PI / 2)]);
    }
    points.push(points[0]);
    return points;
  }
  return [];
}
const outlined = new WeakSet();
const sceneShapes = new WeakMap();
// Register before the first frame, so a later style switch cannot accidentally
// sample a changing spring, rope, or force arrow as a static outline.
export function prepareSketchOutlines(root) {
  const candidates = [];
  function visit(parent) {
    for (const node of [...parent.children]) {
      const tag = node.tagName.toLowerCase();
      if (['defs', 'clippath', 'pattern', 'text'].includes(tag)) continue;
      visit(node);
      const classes = (node.getAttribute('class') || '').split(/\s+/);
      if (classes.includes('pencil-outline') || classes.includes('ball-selection')) continue;
      if (!['path', 'rect', 'circle', 'ellipse'].includes(tag)) continue;
      if (tag === 'path' && !node.getAttribute('d')) continue;
      if (node.getAttribute('stroke-dasharray') || node.getAttribute('clip-path')) continue;
      const fill = node.getAttribute('fill');
      const stroke = node.getAttribute('stroke') || (fill && !['none', 'transparent'].includes(fill) && !fill.startsWith('url(') ? fill : null);
      if (stroke) candidates.push({ node, parent, stroke });
    }
  }
  visit(root);
  sceneShapes.set(root, candidates);
  addSketchOutlines(root);
}
export function addSketchOutlines(root) {
  if (document.documentElement?.dataset.illustrationStyle !== 'notebook') return;
  for (const { node, parent, stroke } of sceneShapes.get(root) || []) {
    if (outlined.has(node)) continue;
    const points = outlinePoints(node);
    if (!points.length) continue;
    const attributes = { class: 'pencil-outline', d: pencilPath(points), fill: 'none', stroke,
      'stroke-width': 0.85, opacity: 0.45, 'pointer-events': 'none', 'aria-hidden': 'true', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    if (node.getAttribute('transform')) attributes.transform = node.getAttribute('transform');
    svgElement('path', attributes, parent);
    outlined.add(node);
  }
}
