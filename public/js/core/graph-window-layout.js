// Keep at least 220 CSS pixels per plot before arranging plots in a row.
export function graphsSideBySide(width, count) {
  return count > 1 && width >= count * 220 + 24;
}

const overlap = (a, b) => Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left))
  * Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));

// Prefer readable plots in empty canvas regions; allow overlap when the canvas is too small.
export function chooseGraphWindow({ width, height, obstacles = [], count = 1 }) {
  const gap = 8, availableWidth = Math.max(1, width - 2 * gap);
  const availableHeight = Math.max(1, height - 2 * gap);
  count = Math.max(1, count);
  const unique = values => [...new Set(values.map(value => Math.round(value)))];
  const widths = unique([320, 380, count * 250 + 24, ...obstacles.flatMap(o => [o.left - 2 * gap, width - o.left - o.width - 2 * gap])].map(value => Math.min(value, availableWidth)));
  const clearHeights = obstacles.flatMap(o => [o.top - 2 * gap, height - o.top - o.height - 2 * gap]);
  let best, bestScore = -Infinity;
  // Search internal gaps too: two views can leave useful space between them.
  const edges = unique([gap, width - gap, ...obstacles.flatMap(o => [o.left - gap, o.left + o.width + gap])]
    .map(x => Math.max(gap, Math.min(x, width - gap)))).sort((a, b) => a - b);
  for (let leftIndex = 0; leftIndex < edges.length; leftIndex++) {
    for (let rightIndex = leftIndex + 1; rightIndex < edges.length; rightIndex++) {
      const left = edges[leftIndex], w = edges[rightIndex] - left;
      if (w < Math.min(220, availableWidth)) continue;
      const blocked = obstacles.filter(o => o.left < left + w && o.left + o.width > left)
        .map(o => [Math.max(gap, o.top - gap), Math.min(height - gap, o.top + o.height + gap)])
        .filter(([start, end]) => end > start).sort((a, b) => a[0] - b[0]);
      let top = gap;
      for (const [start, end] of [...blocked, [height - gap, height - gap]]) {
        const h = start - top;
        if (h >= Math.min(180, availableHeight)) {
          const horizontal = graphsSideBySide(w, count);
          const plotWidth = (w - 24) / (horizontal ? count : 1);
          const plotHeight = Math.max(1, (h - 104) / (horizontal ? 1 : count));
          const score = Math.min(plotWidth, plotHeight * 480 / 230) - w * h / (width * height) * 30;
          if (score > bestScore) { bestScore = score; best = { left, top, width: w, height: h }; }
        }
        top = Math.max(top, end);
      }
    }
  }
  for (const requestedWidth of widths) {
    if (requestedWidth < Math.min(220, availableWidth)) continue;
    const w = Math.min(requestedWidth, availableWidth);
    const horizontal = graphsSideBySide(w, count);
    const plotWidth = horizontal ? (w - 24) / count : w - 24;
    const idealHeight = 104 + (horizontal ? 1 : count) * (plotWidth * 230 / 480);
    for (const requestedHeight of unique([idealHeight, 220, 280, availableHeight, ...clearHeights].filter(h => h >= Math.min(180, availableHeight)).map(h => Math.min(h, availableHeight)))) {
      const h = Math.min(availableHeight, Math.max(Math.min(180, availableHeight), requestedHeight));
      const xs = unique([gap, width - w - gap, ...obstacles.flatMap(o => [o.left - w - gap, o.left + o.width + gap])].map(x => Math.max(gap, Math.min(x, width - w - gap))));
      const ys = unique([gap, 54, height - h - gap, ...obstacles.flatMap(o => [o.top - h - gap, o.top + o.height + gap])].map(y => Math.max(gap, Math.min(y, height - h - gap))));
      for (const x of xs) for (const y of ys) {
        const candidate = { left: Math.max(gap, Math.min(x, width - w - gap)), top: Math.max(gap, Math.min(y, height - h - gap)), width: w, height: h };
        const plotHeight = Math.max(1, (h - 104) / (horizontal ? 1 : count));
        const readableWidth = Math.min(plotWidth, plotHeight * 480 / 230);
        const covered = obstacles.reduce((sum, o) => sum + overlap(candidate, o), 0);
        // A small clear plot is preferable to covering a moving object with a larger plot.
        const score = readableWidth - 4000 * covered / (w * h) - w * h / (width * height) * 30;
        if (score > bestScore) { bestScore = score; best = candidate; }
      }
    }
  }
  return best ?? { left: 0, top: 0, width, height };
}
