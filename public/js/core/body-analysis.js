import { element, button, setText } from './dom.js';
import { renderMath } from './math.js';

// The demo supplies physical data and authored mathematics; this panel owns presentation only.
export function createBodyAnalysis({ parent, signal, onClose, id }) {
  const root = element('section', 'body-analysis'); root.id = id; root.hidden = true;
  root.setAttribute('aria-labelledby', `${id}-title`);
  const header = element('div', 'analysis-heading');
  const title = element('h2'); title.id = `${id}-title`;
  title.setAttribute('tabindex', '-1');
  const close = button('', 'button secondary'); header.append(title, close);
  const notice = element('p', 'analysis-notice'); notice.setAttribute('role', 'status');
  const axis = element('p', 'analysis-note');
  const equations = element('div');
  const groups = element('div', 'motion-equation-groups');
  const numeric = element('details', 'analysis-expansion'); const numericTitle = element('summary'); const numericBody = element('div'); numeric.append(numericTitle, numericBody);
  const solution = element('details', 'analysis-expansion'); const solutionTitle = element('summary'); const solutionBody = element('div'); solution.append(solutionTitle, solutionBody);
  const cutoff = element('p', 'analysis-notice');
  root.append(header, notice, axis, equations, groups, numeric, solution, cutoff); parent.append(root);
  close.addEventListener('click', onClose, { signal });
  root.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } }, { signal });
  const sectionSignatures = new WeakMap();
  function steps(container, items) {
    const signature = JSON.stringify(items);
    if (sectionSignatures.get(container) === signature) return;
    sectionSignatures.set(container, signature);
    container.replaceChildren();
    for (const item of items) {
      const p = element(item.math ? 'div' : 'p', item.math ? 'equation' : '', item.math ? undefined : item.text);
      if (item.math) { p.setAttribute('dir', 'ltr'); p.append(renderMath(item)); }
      container.append(p);
    }
  }
  let lastData = '', lastGroups = '';
  let returnPosition = null, revealFrame;
  const mobileLayout = matchMedia('(max-width: 600px), (max-width: 1000px) and (max-height: 600px) and (orientation: landscape)');
  signal.addEventListener('abort', () => cancelAnimationFrame(revealFrame), { once: true });
  return {
    root,
    hide() {
      cancelAnimationFrame(revealFrame);
      root.hidden = true;
      if (returnPosition) globalThis.scrollTo?.({ ...returnPosition, behavior: 'instant' });
      returnPosition = null;
    },
    update(data) {
      if (root.hidden && mobileLayout.matches) {
        returnPosition = { left: globalThis.scrollX ?? 0, top: globalThis.scrollY ?? 0 };
        revealFrame = requestAnimationFrame(() => {
          if (root.hidden || signal.aborted) return;
          title.focus({ preventScroll: true });
          title.scrollIntoView?.({ block: 'start', behavior: 'instant' });
        });
      }
      root.hidden = false;
      const signature = JSON.stringify(data);
      if (signature === lastData) return;
      lastData = signature;
      setText(title, data.title); setText(close, data.close);
      setText(notice, data.notice); notice.hidden = !data.notice;
      setText(axis, data.axis);
      numeric.hidden = !data.numeric; solution.hidden = !data.solution;
      setText(numericTitle, data.numericTitle || ''); setText(solutionTitle, data.solutionTitle || '');
      setText(cutoff, data.cutoff); cutoff.hidden = !data.cutoff;
      steps(equations, data.equations); steps(numericBody, data.numeric || []); steps(solutionBody, data.solution || []);
      const groupSignature = JSON.stringify(data.groups || []);
      if (groupSignature === lastGroups) return;
      lastGroups = groupSignature;
      groups.replaceChildren(); groups.hidden = !data.groups?.length;
      for (const group of data.groups || []) {
        const section = element('section', 'motion-equation-group');
        const heading = element('h3', '', group.title); const content = element('div');
        steps(content, group.steps); section.append(heading, content); groups.append(section);
      }
    },
  };
}
