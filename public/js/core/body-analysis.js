import { element, button } from './dom.js';
import { renderMath } from './math.js';

// The demo supplies physical data and authored mathematics; this panel owns presentation only.
export function createBodyAnalysis({ parent, signal, onClose, id }) {
  const root = element('section', 'body-analysis'); root.id = id; root.hidden = true;
  root.setAttribute('aria-labelledby', `${id}-title`);
  const header = element('div', 'analysis-heading');
  const title = element('h2'); title.id = `${id}-title`;
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
  function steps(container, items) {
    container.replaceChildren();
    for (const item of items) {
      const p = element(item.math ? 'div' : 'p', item.math ? 'equation' : '', item.math ? undefined : item.text);
      if (item.math) { p.setAttribute('dir', 'ltr'); p.append(renderMath(item)); }
      container.append(p);
    }
  }
  let lastData = '';
  return {
    root,
    hide() { root.hidden = true; },
    update(data) {
      root.hidden = false;
      const signature = JSON.stringify(data);
      if (signature === lastData) return;
      lastData = signature;
      title.textContent = data.title; close.textContent = data.close;
      notice.textContent = data.notice; notice.hidden = !data.notice;
      axis.textContent = data.axis;
      numeric.hidden = !data.numeric; solution.hidden = !data.solution;
      numericTitle.textContent = data.numericTitle || ''; solutionTitle.textContent = data.solutionTitle || '';
      cutoff.textContent = data.cutoff; cutoff.hidden = !data.cutoff;
      steps(equations, data.equations); steps(numericBody, data.numeric || []); steps(solutionBody, data.solution || []);
      groups.replaceChildren(); groups.hidden = !data.groups?.length;
      for (const group of data.groups || []) {
        const section = element('section', 'motion-equation-group');
        const heading = element('h3', '', group.title); const content = element('div');
        steps(content, group.steps); section.append(heading, content); groups.append(section);
      }
    },
  };
}
