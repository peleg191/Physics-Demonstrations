import { element, button, setText } from './dom.js';
import { renderMath } from './math.js';
import { createAnalysisTabs } from './analysis-tabs.js';
import { createAnalysisHighlights } from './analysis-highlights.js';

// The demo supplies physical data and authored mathematics; this panel owns presentation only.
export function createBodyAnalysis({ parent, signal, onClose, onHighlight, id }) {
  const root = element('section', 'body-analysis'); root.id = id; root.hidden = true;
  root.setAttribute('aria-labelledby', `${id}-title`);
  const header = element('div', 'analysis-heading');
  const title = element('h2'); title.id = `${id}-title`;
  title.setAttribute('tabindex', '-1');
  const close = button('', 'button secondary');
  const jumpBack = button('', 'text-button analysis-back'); jumpBack.hidden = true;
  const actions = element('div', 'analysis-heading-actions');
  actions.append(close, jumpBack);
  header.append(title, actions);
  const notice = element('p', 'analysis-notice'); notice.setAttribute('role', 'status');
  const axis = element('p', 'analysis-note');
  const context = element('section', 'analysis-context');
  const contextTitle = element('h3');
  context.append(contextTitle, axis);
  const governing = element('section', 'analysis-governing');
  const governingTitle = element('h3');
  const equations = element('div', 'analysis-governing-equations');
  const groups = element('div', 'motion-equation-groups');
  governing.append(governingTitle, equations, groups);
  const comparison = element('section', 'analysis-comparison');
  const numeric = element('details', 'analysis-expansion'); const numericTitle = element('summary');
  const numericIntro = element('h4', 'analysis-substitution-title');
  const numericBody = element('div'); numeric.append(numericTitle, numericIntro, numericBody);
  const solution = element('details', 'analysis-expansion'); const solutionTitle = element('summary'); const solutionBody = element('div'); solution.append(solutionTitle, solutionBody);
  const cutoff = element('p', 'analysis-notice');
  root.append(header, notice, context, governing, comparison, numeric, solution, cutoff); parent.append(root);
  const tabs = createAnalysisTabs({ parent, analysis: root, jumpBack, signal });
  const highlights = createAnalysisHighlights({ root, stage: parent.querySelector?.('.stage'), id, signal, onHighlight });
  close.addEventListener('click', onClose, { signal });
  root.addEventListener('keydown', event => { if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); onClose(); } }, { signal });
  const sectionSignatures = new WeakMap();
  function steps(container, items, linkTerms = false) {
    const signature = JSON.stringify(items);
    if (sectionSignatures.get(container) === signature) return;
    sectionSignatures.set(container, signature);
    container.replaceChildren();
    for (const item of items) {
      const p = element(item.heading ? 'h3' : item.math ? 'div' : 'p', item.math ? 'equation' : '', item.math ? undefined : item.text);
      if (item.math) {
        p.setAttribute('dir', 'ltr');
        const math = renderMath(item);
        if (linkTerms) highlights?.decorate(math);
        p.append(math);
      }
      container.append(p);
    }
    return true;
  }
  let comparisonShape;
  let comparisonCells = [];
  function updateComparison(data) {
    comparison.hidden = !data;
    if (!data) return;
    const shape = JSON.stringify([data.title, data.columns, data.rows.map(row => [row[0], row.length])]);
    if (comparisonShape !== shape) {
      comparisonShape = shape;
      const table = element('table');
      table.append(element('caption', '', data.title));
      const headers = element('tr');
      for (const name of data.columns) {
        const cell = element('th', '', name); cell.scope = 'col';
        headers.append(cell);
      }
      const head = element('thead'); head.append(headers);
      const body = element('tbody');
      comparisonCells = data.rows.map(([name, ...values]) => {
        const row = element('tr');
        const heading = element('th', '', name); heading.scope = 'row';
        row.append(heading);
        const cells = values.map(() => {
          const cell = element('td');
          const value = element('bdi');
          cell.append(value); row.append(cell);
          return value;
        });
        body.append(row);
        return cells;
      });
      table.append(head, body);
      comparison.replaceChildren(table);
    }
    for (const [index, cells] of comparisonCells.entries()) {
      cells.forEach((cell, column) => setText(cell, data.rows[index][column + 1]));
    }
  }
  let lastData = '', lastGroups = '';
  return {
    root,
    reveal() {
      tabs?.reveal();
    },
    hide() {
      if (root.hidden) return;
      root.hidden = true;
      highlights?.clear();
      tabs?.close();
    },
    update(data) {
      root.hidden = false;
      tabs?.update();
      const signature = JSON.stringify(data);
      if (signature === lastData) return;
      lastData = signature;
      setText(title, data.title); setText(close, data.close);
      setText(notice, data.notice); notice.hidden = !data.notice;
      const hebrew = document.documentElement?.lang === 'he';
      setText(contextTitle, hebrew ? 'מה קורה בניסוי' : 'What’s happening');
      setText(governingTitle, hebrew ? 'משוואות היסוד' : 'Governing equations');
      setText(axis, data.axis || '');
      context.hidden = !data.axis;
      governing.hidden = !data.equations.length && !data.groups?.length;
      numeric.hidden = !data.numeric; solution.hidden = !data.solution;
      setText(numericTitle, hebrew ? 'ערכים נוכחיים והצבה' : 'Current values and substitution');
      setText(numericIntro, data.numericTitle || '');
      numericIntro.hidden = !data.numericTitle;
      setText(solutionTitle, data.solutionTitle || '');
      setText(cutoff, data.cutoff); cutoff.hidden = !data.cutoff;
      const equationsChanged = steps(equations, data.equations, true);
      steps(numericBody, data.numeric || []);
      steps(solutionBody, data.solution || []);
      updateComparison(data.comparison);
      const groupSignature = JSON.stringify(data.groups || []);
      if (groupSignature === lastGroups) {
        if (equationsChanged) highlights?.refresh();
        return;
      }
      lastGroups = groupSignature;
      groups.replaceChildren(); groups.hidden = !data.groups?.length;
      for (const group of data.groups || []) {
        const section = element('section', 'motion-equation-group');
        const heading = element('h3', '', group.title); const content = element('div');
        steps(content, group.steps, true); section.append(heading, content); groups.append(section);
      }
      highlights?.refresh();
    },
  };
}
