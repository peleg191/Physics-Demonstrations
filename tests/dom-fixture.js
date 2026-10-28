// Minimal DOM adapter for module lifecycle tests. This does not replace browser QA.
class Node extends EventTarget {
  constructor(tag) {
    super(); this.tagName = tag; this.children = []; this.attributes = {}; this.parentNode = null;
    this.style = { setProperty() {} }; this.className = ''; this._text = ''; this.value = ''; this.disabled = false;
    this.classList = { toggle: (key, value) => { const classes = new Set(this.className.split(' ').filter(Boolean)); value ? classes.add(key) : classes.delete(key); this.className = [...classes].join(' '); } };
  }
  append(...nodes) { for (const node of nodes) { node.parentNode = this; this.children.push(node); } }
  replaceChildren(...nodes) { for (const node of this.children) node.parentNode = null; this.children = []; this._text = ''; this.append(...nodes); }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(n => n !== this); this.parentNode = null; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  getAttribute(key) { return this.attributes[key] ?? null; }
  set textContent(text) { this.children = []; this._text = String(text); }
  get textContent() { return this._text + this.children.map(n => n.textContent).join(''); }
  get valueAsNumber() { return this.value.trim() === '' ? NaN : Number(this.value); }
}
export function browserFixture() {
  const document = new EventTarget();
  document.createElement = tag => new Node(tag);
  document.createElementNS = (ns, tag) => new Node(tag);
  document.hidden = false;
  let next = 0; const frames = new Map();
  const saved = new Map();
  for (const [key, value] of Object.entries({ document, matchMedia: () => ({ matches: false }), requestAnimationFrame: fn => { frames.set(++next, fn); return next; }, cancelAnimationFrame: id => frames.delete(id) })) {
    saved.set(key, globalThis[key]); globalThis[key] = value;
  }
  const root = document.createElement('main');
  function find(predicate, node = root) { if (predicate(node)) return node; for (const child of node.children) { const found = find(predicate, child); if (found) return found; } }
  return { root, document, frames, find,
    frame(now) { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(now)); },
    cleanup() { for (const [key, value] of saved) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; } },
  };
}
