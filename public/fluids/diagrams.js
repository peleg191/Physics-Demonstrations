import { g, pipeInletRadius } from './models.js';

function pen(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(canvas.width / 560, 0, 0, canvas.height / 345, 0, 0);
  ctx.clearRect(0, 0, 560, 345);
  const { theme, illustrationStyle } = document.documentElement.dataset;
  const dark = theme === 'dark';
  const notebook = illustrationStyle === 'notebook';
  const highlighted = canvas.parentElement?.dataset.analysisHighlight;
  const highlightColor = dark ? '#ffd38b' : '#a15818';
  const colors = dark
    ? { ink: '#e2ece3', water: notebook ? '#30474f' : '#285159', blue: '#a4e8f6', onBlue: '#18333b', weight: '#ffb28f', block: '#8e5d36', metal: '#94b0a5' }
    : { ink: '#26483f', water: notebook ? '#e0edf3' : '#b6dfe1', blue: '#21647b', onBlue: '#ffffff', weight: '#a94b2e', block: '#f1cd9d', metal: '#6e8b7e' };
  function waterFill(top, bottom) {
    if (notebook) return colors.water;
    const gradient = ctx.createLinearGradient(0, top, 0, bottom);
    gradient.addColorStop(0, colors.water);
    gradient.addColorStop(1, dark ? '#1e3d45' : '#92c5cc');
    return gradient;
  }
  function path(points, color = colors.ink, width = 2, fill = false) {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    if (fill) {
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = notebook ? width * 0.85 : width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }
  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    if (notebook && (color === colors.block || color === colors.metal)) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.globalAlpha = 0.18;
      for (let offset = -h; offset < w; offset += 8) {
        path([[x + offset, y + h], [x + offset + h, y]], colors.ink, 1);
      }
      ctx.restore();
    }
  }
  function label(text, x, y, color = colors.ink, subscript = '') {
    ctx.fillStyle = color;
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.textAlign = subscript ? 'left' : 'center';
    if (!subscript) {
      ctx.fillText(text, x, y);
      return;
    }
    const baseWidth = ctx.measureText(text).width;
    ctx.font = '600 12px system-ui, sans-serif';
    const left = x - (baseWidth + ctx.measureText(subscript).width) / 2;
    ctx.fillText(subscript, left + baseWidth, y + 4);
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.fillText(text, left, y);
  }
  function highlightBox(term, x, y, width, height) {
    if (highlighted !== term) return;
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
  }
  function highlightPoint(terms, x, y) {
    if (!terms.includes(highlighted)) return;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  function arrow(x, start, end, color, horizontal = false, term) {
    const length = Math.abs(end - start);
    if (length < 2) return;
    const head = Math.min(9, length * 0.55);
    const neck = end - Math.sign(end - start) * head;
    const point = (across, along) => horizontal ? [along, across] : [across, along];
    if (term && highlighted === term) path([point(x, start), point(x, end)], highlightColor, 8);
    path([point(x, start), point(x, neck)], color, 3);
    path([point(x - head * 2 / 3, neck), point(x + head * 2 / 3, neck), point(x, end)], color, 0, true);
  }
  return { ctx, notebook, colors, waterFill, path, rect, label, arrow, highlightBox, highlightPoint };
}

const smoothstep = value => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

function tracer(ctx, x, y, radius, opacity, outline) {
  if (opacity <= 0) return;
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = '#f5ffff';
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

const pistons = { input: 128, load: 407 };
const pistonHeight = 151;
const blockTop = position => 134 - 84 * (1 - position);
const outletHeight = 236;
const surfaceHeight = depth => outletHeight - 27 * depth;

const pipeCenter = drop => [120 - 12 * drop, 120 + 27 * drop];
const pipeTargets = ({ drop = 0 }) => {
  const [y1, y2] = pipeCenter(drop);
  return { inlet: [110, y1], outlet: [430, y2] };
};

export const targetPositions = {
  'narrowing-pipe': pipeTargets,
  'descending-pipe': pipeTargets,
  pascal: ({ inputTravel = 0, loadTravel = 0 }) => ({
    input: [pistons.input, pistonHeight + inputTravel],
    load: [pistons.load, pistonHeight - 29 - loadTravel],
  }),
  buoyancy: ({ position }) => ({ block: [280, blockTop(position) + 42] }),
  bernoulli: ({ depth }) => ({ surface: [180, surfaceHeight(depth) - 16], outlet: [291, outletHeight - 17] }),
};

export function drawHydraulic(canvas, {
  inputArea, outputArea, force, mass, inputTravel = 0, loadTravel = 0, pressureHighlight = 0,
}, { outputForce, pressure }, phase, selected, format) {
  const { ctx, notebook, colors, waterFill, path, rect, label, arrow, highlightBox } = pen(canvas);
  const { input: left, load: right } = pistons;
  const inputY = pistonHeight + inputTravel;
  const loadY = pistonHeight - loadTravel;
  const width = area => 28 + 10 * Math.sqrt(area);
  const [a, b, c, d] = [left - width(inputArea) / 2, left + width(inputArea) / 2,
    right - width(outputArea) / 2, right + width(outputArea) / 2];
  const liquid = [[a, inputY], [b, inputY], [b, 235], [c, 235], [c, loadY], [d, loadY], [d, 278], [a, 278]];
  path(liquid, waterFill(loadY, 278), 0, true);
  ctx.globalAlpha = pressureHighlight * 0.2;
  path(liquid, colors.blue, 0, true);
  ctx.globalAlpha = 1;
  if (!notebook) path([[a + 5, inputY + 9], [a + 5, 271], [d - 5, 271], [d - 5, loadY + 9]], colors.blue, 0.8);
  path([[a, 127], [a, 278], [d, 278], [d, 96]], colors.ink, 3);
  path([[b, 127], [b, 235], [c, 235], [c, 96]], colors.ink, 3);
  rect(a, inputY - 6, b - a, 12, colors.metal);
  rect(c, loadY - 6, d - c, 12, colors.metal);
  rect(right - 29, loadY - 49, 58, 43, colors.block);
  path([[right - 29, loadY - 6], [right - 29, loadY - 49], [right + 29, loadY - 49], [right + 29, loadY - 6]]);
  label('M', right, loadY - 21);
  const showBoth = !selected.size && pressureHighlight > 0;
  if (selected.has('input') || showBoth) {
    const length = force ? 18 + Math.min(force, 80) / 2 : 0;
    arrow(left - 13, inputY - 12 - length, inputY - 12, colors.weight, false, 'F1');
    arrow(left + 13, inputY + 14 + length, inputY + 14, colors.blue);
    label('F₁', left - 32, inputY - 16, colors.weight);
    label('Δp A₁', left + 55, inputY + 41, colors.blue);
  }
  if (selected.has('load') || showBoth) {
    const largest = Math.max(outputForce, mass * g);
    const arrowSize = value => 54 * value / largest;
    arrow(right - 25, loadY + 64, loadY + 64 - arrowSize(outputForce), colors.blue, false, 'F2');
    label('F₂', right - 25, loadY + 80, colors.blue);
    arrow(right + 20, loadY - 53 - arrowSize(mass * g), loadY - 53, colors.weight, false, 'Mg');
    label('Mg', right + 49, loadY - 65, colors.weight);
  }
  label('A₁', left, 253);
  label('A₂', right, 253);
  label(`Δp = ${format(pressure / 1000)} kPa`, 267, 265, colors.blue);
  highlightBox('Δp', 193, 245, 148, 26);
}

export function drawBuoyancy(canvas, { position, immersion }, { upward, weight, support }, phase, selected) {
  const { colors, waterFill, path, rect, label, arrow } = pen(canvas);
  const surface = 134;
  const height = 84;
  const top = blockTop(position);
  rect(91, surface, 378, 162, waterFill(surface, 296));
  path([[91, 66], [91, 296], [469, 296], [469, 66]], colors.ink, 3);
  path([[91, surface], [469, surface]], colors.blue);
  rect(219, top, 122, height, colors.block);
  rect(219, Math.max(top, surface), 122, height * immersion, colors.metal);
  path([[219, top], [341, top], [341, top + height], [219, top + height], [219, top]], colors.ink, 3);
  if (immersion > 0 && immersion < 1) path([[219, surface], [341, surface]], colors.blue, 1.3);
  if (!selected.has('block')) return;
  const center = top + height / 2;
  const scale = 58 / Math.max(upward, weight);
  arrow(263, center, center - upward * scale, colors.blue, false, 'FB');
  arrow(297, center, center + weight * scale, colors.weight, false, 'mg');
  if (upward) label('F', 244, center - upward * scale + 9, colors.blue, 'B');
  label('mg', 325, center + weight * scale, colors.weight);
  if (support) {
    arrow(307, 296, 296 - support * scale, colors.ink, false, 'N');
    label('N', 349, 292, colors.ink);
  }
}

export function drawTank(canvas, { depth }, { speed, surfaceSpeed }, phase, selected) {
  const { ctx, notebook, colors, waterFill, path, rect, label, arrow, highlightBox, highlightPoint } = pen(canvas);
  const outlet = outletHeight;
  const surface = surfaceHeight(depth);
  rect(84, surface, 190, 276 - surface, waterFill(surface, 276));
  path([[84, 53], [84, 276], [274, 276], [274, outlet + 5]], colors.ink, 3);
  path([[274, outlet - 5], [274, 53]], colors.ink, 3);
  path([[84, surface], [274, surface]], colors.blue);
  label('1', 180, surface - 10, colors.blue);
  label('2', 291, outlet - 12, colors.blue);
  highlightPoint(['p1', 'patm'], 180, surface - 16);
  highlightPoint(['p2', 'patm'], 291, outlet - 17);
  if (depth <= 0) return;
  if (selected.has('surface')) {
    arrow(198, surface + 4, surface + 16 + 13 * surfaceSpeed, colors.blue, false, 'v1');
    label('v₁', 221, surface + 30, colors.blue);
  }
  if (selected.has('outlet')) {
    arrow(outlet - 27, 318, 340 + 6 * speed, colors.blue, true, 'v2');
    label('v₂', 359, outlet - 38, colors.blue);
    arrow(360, outlet + 13, outlet + 70, colors.weight, false, 'g');
    label('g', 378, outlet + 58, colors.weight);
  }
  path([[64, outlet], [54, outlet], [54, surface], [64, surface]], colors.ink);
  label('h', 38, (outlet + surface) / 2 + 6);
  highlightBox('h', 27, (outlet + surface) / 2 - 13, 22, 25);
  const flight = Math.min(Math.sqrt(2 * (318 - outlet) / (27 * g)), (525 - 274) / (27 * speed));
  const point = time => [274 + 27 * speed * time, outlet + 27 * g * time ** 2 / 2];
  const jetWidth = 5 * smoothstep(speed / 2);
  const jet = Array.from({ length: 25 }, (_, i) => point(i * flight / 24));
  path(jet, colors.blue, notebook ? jetWidth * 0.6 : jetWidth);
  if (!notebook) path(jet, colors.water, jetWidth * 0.5);
  const interval = 0.075;
  for (let age = phase % interval; age < flight; age += interval) {
    const [x, y] = point(age);
    const opacity = smoothstep(age / 0.04) * smoothstep((flight - age) / 0.08);
    tracer(ctx, x, y, jetWidth * 0.36, opacity, colors.blue);
  }
}

function drawTracers(ctx, section, speed1, elapsed, colors) {
  const [inletX, , inletHalfHeight] = section[0];
  const [outletX] = section.at(-1);
  const fadeDistance = 34;
  const pixelsPerMeter = 46;
  const times = [0];
  for (let i = 1; i < section.length; i++) {
    const [x, y, height] = section[i];
    const [previousX, previousY, previousHeight] = section[i - 1];
    const radiusRatio = ((height + previousHeight) / 2) / inletHalfHeight;
    const speed = speed1 / radiusRatio ** 2;
    const distance = Math.hypot(x - previousX, y - previousY) / pixelsPerMeter;
    times.push(times[i - 1] + distance / speed);
  }
  const transitTime = times.at(-1);
  const count = 10;
  for (const [index, lane] of [-0.65, 0, 0.65].entries()) {
    for (let dot = 0; dot < count; dot++) {
      const time = (elapsed + transitTime * (dot + index / 3) / count) % transitTime;
      const next = times.findIndex(value => value > time);
      if (next < 1) continue;
      const [x0, y0, h0] = section[next - 1];
      const [x1, y1, h1] = section[next];
      const blend = (time - times[next - 1]) / (times[next] - times[next - 1]);
      const x = x0 + blend * (x1 - x0);
      const y = y0 + lane * h0 + blend * (y1 - y0 + lane * (h1 - h0));
      const opacity = smoothstep((x - inletX) / fadeDistance) * smoothstep((outletX - x) / fadeDistance);
      tracer(ctx, x, y, lane === 0 ? 3.1 : 2.3, opacity, colors.blue);
    }
  }
}

export function drawPipe(canvas, { drop = 0, radius2, speed1, pressure1 }, { speed2, pressure2 }, phase, _selected, format) {
  const { ctx, notebook, colors, waterFill, path, rect, label, arrow, highlightBox } = pen(canvas);
  const [y1, y2] = pipeCenter(drop);
  const halfHeight = radius => radius * 185;
  const section = Array.from({ length: 51 }, (_, i) => {
    const x = 52 + 456 * i / 50;
    const blend = smoothstep((x - 146) / 230);
    return [x, y1 + blend * (y2 - y1), halfHeight(pipeInletRadius + blend * (radius2 - pipeInletRadius))];
  });
  const curve = lane => section.map(([x, y, height]) => [x, y + lane * height]);
  const top = curve(-1);
  const bottom = curve(1);
  path([...top, ...bottom.slice().reverse()], waterFill(
    Math.min(top[0][1], top.at(-1)[1]), Math.max(bottom[0][1], bottom.at(-1)[1]),
  ), 0, true);
  if (!notebook) {
    ctx.globalAlpha = 0.38;
    for (const lane of [-0.65, 0, 0.65]) path(curve(lane), colors.blue, 0.8);
    ctx.globalAlpha = 1;
  }
  path(top, colors.ink, 2.6);
  path(bottom, colors.ink, 2.6);
  drawTracers(ctx, section, speed1, phase, colors);
  const velocityScale = 65 / Math.max(speed1, speed2);
  const barWidth = 104;
  const barTop = 298;
  const barHeight = 24;
  const pressureScale = barWidth / Math.max(pressure1 * 1000, pressure2);
  for (const [index, x, y, speed, pressure] of [
    [1, 110, y1, speed1, pressure1 * 1000], [2, 430, y2, speed2, pressure2],
  ]) {
    arrow(y, x - 13, x + velocityScale * speed, colors.blue, true, `v${index}`);
    label('v', x - 11, y - 11, colors.blue, String(index));
    label(String(index), x, y - halfHeight(index === 1 ? pipeInletRadius : radius2) - 15);
    label('p', x, 289, colors.blue, String(index));
    const left = x - barWidth / 2;
    const fillWidth = Math.max(0, pressure * pressureScale);
    rect(left, barTop, barWidth, barHeight, colors.water);
    rect(left, barTop, fillWidth, barHeight, colors.blue);

    // Keep the value legible wherever it crosses the filled edge of the bar.
    const text = `${format(pressure / 1000)} kPa`;
    ctx.save();
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'ltr';
    ctx.fillStyle = colors.ink;
    ctx.fillText(text, x, barTop + barHeight / 2);
    ctx.beginPath();
    ctx.rect(left, barTop, fillWidth, barHeight);
    ctx.clip();
    ctx.fillStyle = colors.onBlue;
    ctx.fillText(text, x, barTop + barHeight / 2);
    ctx.restore();
    highlightBox(`p${index}`, left, barTop, barWidth, barHeight);
    highlightBox('Δp', left, barTop, barWidth, barHeight);
  }
  if (drop > 0) {
    path([[532, y1], [541, y1], [541, y2], [532, y2]], colors.ink, 1.5);
    label('Δz', 529, (y1 + y2) / 2 + 4);
  }
}
