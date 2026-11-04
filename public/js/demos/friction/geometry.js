// Screen coordinates: d points downhill; n points out of the slope.
export function sceneGeometry(kind, params, position = 0, topPosition = position) {
  const offset = position * 42;
  if (kind === 'stacked') return { bodies: [{ x: 230 + topPosition * 42, y: 235, angle: 0 }, { x: 230 + offset, y: 285, angle: 0 }], ground: 'M 45 310 H 600' };
  const angle = params.angle * Math.PI / 180, c = Math.cos(angle), sn = Math.sin(angle);
  const vertex = { x: 310, y: 145 }, radius = 16;
  const foot = { x: vertex.x + 285 * c, y: vertex.y + 285 * sn };
  // Stay below the sloping edge and above the base. Shallow triangles need
  // more horizontal room for the full angle label than steep triangles do.
  const angleInset = Math.max(92, 45 + 31 / Math.tan(angle));
  // The outgoing rope is 25 px above the slope, through the block's centre.
  // Its signed distance to the wheel centre is exactly radius.
  const wheel = kind === 'table'
    ? { x: vertex.x + 9 * Math.tan(angle / 2), y: vertex.y - 9, radius }
    : { x: vertex.x - 50, y: vertex.y - (9 + 50 * sn) / c, radius };
  const entry = kind === 'table' ? { x: wheel.x, y: wheel.y - radius } : { x: wheel.x - radius, y: wheel.y };
  const exit = { x: wheel.x + radius * sn, y: wheel.y - radius * c };
  const first = kind === 'table' ? { x: 150 + offset, y: 120, angle: 0 } : { x: entry.x, y: 250 - offset, angle: 0 };
  const second = { x: vertex.x + (140 + offset) * c + 25 * sn, y: vertex.y + (140 + offset) * sn - 25 * c, angle: params.angle };
  const start = kind === 'table' ? { x: first.x + 32, y: first.y } : { x: first.x, y: first.y - 25 };
  const end = { x: second.x - 32 * c, y: second.y - 32 * sn };
  const rope = `M ${start.x} ${start.y} L ${entry.x} ${entry.y} A ${radius} ${radius} 0 0 1 ${exit.x} ${exit.y} L ${end.x} ${end.y}`;
  return { bodies: [first, second], wheel, entry, exit, start, end, c, sn, foot,
    ground: `${kind === 'table' ? `M 45 145 H ${vertex.x} M ${vertex.x} 145` : `M ${vertex.x} 145`} L ${foot.x} ${foot.y} H ${vertex.x} Z`, rope,
    angleArc: `M ${foot.x - 45} ${foot.y} A 45 45 0 0 1 ${foot.x - 45 * c} ${foot.y - 45 * sn}`,
    angleLabel: { x: Math.max(vertex.x + 50, foot.x - angleInset), y: foot.y - 17 },
  };
}

// Short backslash strokes on the material side of a rough contact surface.
export function roughSurfacePath(kind, geometry) {
  function hatch(x1, y1, x2, y2, spacing = 12, depth = 9) {
    const length = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / length, uy = (y2 - y1) / length;
    const strokes = [];
    for (let along = 5; along < length - 6; along += spacing) {
      const x = x1 + along * ux, y = y1 + along * uy;
      strokes.push(`M ${x} ${y} l ${5 * ux - depth * uy} ${5 * uy + depth * ux}`);
    }
    return strokes.join(' ');
  }
  if (kind === 'stacked') {
    const x = geometry.bodies[1].x;
    return `${hatch(45, 310, 600, 310)} ${hatch(x - 32, 260, x + 32, 260, 10, 6)}`;
  }
  return kind === 'table' ? hatch(45, 145, 310, 145) : hatch(310, 145, geometry.foot.x, geometry.foot.y);
}
