const pipeTerms = 'p1 p2 Δp v1 v2';
const frictionTerms = 'mg m1g m2g N1 N2 Nf Nt F T fs fk fkt fsf';

const linkedTerms = {
  basketball: 'vx vy',
  pulley: 'T m1g m2g',
  incline: 'mg N fs fk',
  pendulum: 'mgθ',
  spring: 'F kx',
  'double-spring': '2kx',
  'vertical-spring': 'Fnet',
  'incline-spring': 'Fnet',
  elevator: 'N mg',
  'friction-stacked': frictionTerms,
  'friction-table': frictionTerms,
  'friction-hanging': frictionTerms,
  carousel: 'T mg v',
  'rotating-tube': 'N mg fs fk Nwall',
  'two-string': 'T1 T2 mg',
  'energy-bowl': 'N mg',
  'energy-incline': 'Ei Ef mgh',
  'escape-speed': 'U Ei',
  'spring-launcher': 'EA EB EC',
  'hydro-narrowing-pipe': pipeTerms,
  'hydro-descending-pipe': pipeTerms,
  'hydro-pascal': 'Δp F1 F2 Mg',
  'hydro-buoyancy': 'FB N mg',
  'hydro-bernoulli': 'p1 p2 patm v1 v2 g h',
};

const diagramTerm = value => value.normalize('NFKC').replace(/[\s_{},]/gu, '');

export function markDiagramTerm(node, ...terms) {
  const keys = terms.map(diagramTerm);
  const tag = keys.join(' ');
  if (node.getAttribute('data-diagram-term') === tag) return;
  node.setAttribute('data-diagram-term', tag);
  node.classList.toggle('diagram-term-highlight', keys.includes(node.closest?.('.stage')?.dataset.analysisHighlight));
}

export function createAnalysisHighlights({ root, stage, id, signal, onHighlight }) {
  const available = new Set(linkedTerms[id.replace(/-analysis$/, '')]?.split(' '));
  if (!stage || !available.size) return null;
  let hovered, focused, pinned, active, touch;
  const termOf = node => node?.closest?.('[data-analysis-term]');
  function sync() {
    const key = hovered?.dataset.analysisTerm || focused?.dataset.analysisTerm || pinned;
    for (const term of root.querySelectorAll('[data-analysis-term]')) {
      term.classList.toggle('analysis-term-active', term.dataset.analysisTerm === key);
      term.setAttribute('aria-pressed', String(term.dataset.analysisTerm === pinned));
    }
    if (active === key) return;
    active = key;
    stage.dataset.analysisHighlight = key || '';
    for (const node of stage.querySelectorAll('[data-diagram-term]')) {
      node.classList.toggle('diagram-term-highlight', node.dataset.diagramTerm.split(' ').includes(key));
    }
    onHighlight?.();
  }
  function clear() {
    hovered = focused = pinned = undefined;
    sync();
  }
  function toggle(term) {
    pinned = pinned === term.dataset.analysisTerm ? undefined : term.dataset.analysisTerm;
    sync();
  }
  root.addEventListener('pointerover', event => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    const term = termOf(event.target);
    if (term && term !== hovered) { hovered = term; sync(); }
  }, { signal });
  root.addEventListener('pointerout', event => {
    if (hovered && termOf(event.target) === hovered && termOf(event.relatedTarget) !== hovered) {
      hovered = undefined;
      sync();
    }
  }, { signal });
  root.addEventListener('pointerdown', event => {
    touch = event.pointerType === 'touch';
    if (touch) {
      hovered = focused = undefined;
      sync();
    }
  }, { signal });
  root.addEventListener('focusin', event => {
    const term = termOf(event.target);
    focused = !touch && term?.matches(':focus-visible') ? term : undefined;
    sync();
  }, { signal });
  root.addEventListener('focusout', () => { focused = undefined; sync(); }, { signal });
  root.addEventListener('click', event => {
    const term = termOf(event.target);
    if (term && touch) toggle(term);
  }, { signal });
  root.addEventListener('keydown', event => {
    touch = false;
    const term = termOf(event.target);
    if (term && ['Enter', ' '].includes(event.key)) {
      event.preventDefault();
      toggle(term);
    } else if (event.key === 'Escape' && pinned) {
      event.preventDefault();
      event.stopImmediatePropagation();
      clear();
    }
  }, { signal });

  function decorate(math) {
    const doc = math.ownerDocument;
    function label(node, key) {
      const hebrew = doc.documentElement.lang === 'he';
      node.setAttribute('data-analysis-term', key);
      node.setAttribute('tabindex', '0');
      node.setAttribute('role', 'button');
      node.setAttribute('aria-label', hebrew ? `הדגשת ${node.textContent} בתרשים` : `Highlight ${node.textContent} in the diagram`);
      node.setAttribute('aria-pressed', String(key === pinned));
      if (key === active) node.classList.add('analysis-term-active');
    }
    function walk(node) {
      if (['msub', 'mi', 'mtext'].includes(node.localName)) {
        const key = diagramTerm(node.textContent);
        if (available.has(key)) label(node, key);
        return;
      }
      if (node.localName === 'msup' || node.localName === 'msubsup') {
        if (node.localName === 'msubsup') {
          const key = diagramTerm(node.children[0].textContent + node.children[1].textContent);
          if (available.has(key)) label(node, key);
        } else walk(node.firstElementChild);
        return;
      }
      const children = [...node.children];
      if (node.localName !== 'mrow') {
        children.forEach(walk);
        return;
      }
      for (let i = 0; i < children.length; i++) {
        let key = '';
        let end = i;
        let matched;
        while (end < children.length && ['mi', 'msub', 'mn'].includes(children[end].localName)) {
          key += diagramTerm(children[end].textContent);
          if (end > i && available.has(key)) matched = { key, end };
          if (![...available].some(term => term.startsWith(key))) break;
          end++;
        }
        if (!matched) { walk(children[i]); continue; }
        const term = doc.createElementNS(math.namespaceURI, 'mrow');
        node.insertBefore(term, children[i]);
        for (; i <= matched.end; i++) term.append(children[i]);
        i--;
        label(term, matched.key);
      }
    }
    walk(math);
  }
  return {
    decorate, clear,
    refresh() {
      if (hovered && !root.contains(hovered)) hovered = undefined;
      if (focused && !root.contains(focused)) focused = undefined;
      if (pinned && !root.querySelector(`[data-analysis-term="${CSS.escape(pinned)}"]`)) pinned = undefined;
      sync();
    },
  };
}
