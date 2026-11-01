// Keep pointer and keyboard movement within the containing simulation canvas.
export function attachFloatingWindow({ root, parent, handle, resize, signal, initialGeometry, onChange = () => {}, enabled = () => true }) {
  let gesture = null, userAdjusted = false;
  // A new simulation always starts from its own automatic placement.
  // Clear inline geometry as well as interaction state when this instance ends.
  function clearLayout() {
    gesture = null; userAdjusted = false;
    for (const property of ['left', 'top', 'right', 'bottom', 'width', 'height']) root.style[property] = '';
  }
  clearLayout();
  signal.addEventListener('abort', clearLayout, { once: true });
  function apply(left, top, width, height) {
    const bounds = parent.getBoundingClientRect();
    const area = { width: parent.clientWidth ?? bounds.width, height: parent.clientHeight ?? bounds.height };
    if (!area.width || !area.height) return;
    width = Math.min(area.width, Math.max(Math.min(220, area.width), width));
    height = Math.min(area.height, Math.max(Math.min(180, area.height), height));
    Object.assign(root.style, {
      width: `${width}px`, height: `${height}px`,
      left: `${Math.max(0, Math.min(left, area.width - width))}px`,
      top: `${Math.max(0, Math.min(top, area.height - height))}px`,
      right: 'auto', bottom: 'auto',
    });
    onChange(width, height);
  }
  function geometry() {
    const area = parent.getBoundingClientRect(), bounds = root.getBoundingClientRect();
    return { left: bounds.left - area.left - (parent.clientLeft || 0), top: bounds.top - area.top - (parent.clientTop || 0), width: bounds.width, height: bounds.height };
  }
  for (const [control, sizing] of [[handle, false], [resize, true]]) {
    control.addEventListener('pointerdown', event => {
      if (!enabled() || event.button !== 0) return;
      userAdjusted = true;
      gesture = { ...geometry(), x: event.clientX, y: event.clientY, sizing };
      control.setPointerCapture(event.pointerId); event.preventDefault();
    }, { signal });
    control.addEventListener('pointermove', event => {
      if (!enabled() || !gesture) return;
      const g = gesture, dx = event.clientX - g.x, dy = event.clientY - g.y;
      apply(g.left + (g.sizing ? 0 : dx), g.top + (g.sizing ? 0 : dy),
        g.width + (g.sizing ? dx : 0), g.height + (g.sizing ? dy : 0));
    }, { signal });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      control.addEventListener(type, () => { gesture = null; }, { signal });
    }
    control.addEventListener('keydown', event => {
      const delta = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[event.key];
      if (!enabled() || !delta) return;
      event.preventDefault(); event.stopPropagation();
      userAdjusted = true;
      const g = geometry();
      apply(g.left + (sizing ? 0 : delta[0]), g.top + (sizing ? 0 : delta[1]),
        g.width + (sizing ? delta[0] : 0), g.height + (sizing ? delta[1] : 0));
    }, { signal });
  }
  const fit = () => {
    if (signal.aborted || root.hidden || !enabled()) return;
    const g = !userAdjusted && initialGeometry ? initialGeometry() : geometry();
    apply(g.left, g.top, g.width, g.height);
  };
  if (globalThis.ResizeObserver) {
    const observer = new ResizeObserver(fit); observer.observe(parent);
    signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  }
  return { fit };
}
