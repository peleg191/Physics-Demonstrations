import { button, element } from './dom.js';

export const stackedExperimentQuery = '(max-width: 900px), (max-width: 1000px) and (max-height: 600px) and (orientation: landscape)';

export function createAnalysisTabs({ parent, analysis, jumpBack, signal }) {
  const layout = parent.closest?.('.experiment-layout');
  const sidebar = layout?.querySelector('.experiment-sidebar');
  const parameters = layout?.querySelector('.control-panel');
  if (!sidebar || !parameters) return null;

  const stacked = matchMedia(stackedExperimentQuery);
  const stage = parent.querySelector('.stage');
  const viewAnalysis = button('', 'button secondary analysis-jump');
  viewAnalysis.setAttribute('aria-controls', analysis.id);
  stage.after(viewAnalysis);
  stage.tabIndex = -1;
  function jumpTo(target) {
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      block: 'start',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }
  viewAnalysis.addEventListener('click', () => jumpTo(analysis.querySelector('h2')), { signal });
  jumpBack.addEventListener('click', () => jumpTo(stage), { signal });
  const inlinePosition = document.createComment('Inline analysis position');
  analysis.before(inlinePosition);

  const tablist = element('div', 'experiment-tabs');
  tablist.setAttribute('role', 'tablist');
  const parametersTab = button('', 'experiment-tab');
  const analysisTab = button('', 'experiment-tab');
  const analysisPanel = element('div', 'experiment-analysis-panel');
  analysisPanel.tabIndex = 0;
  const prompt = element('p', 'analysis-tab-prompt');
  analysisPanel.append(prompt);
  parameters.id ||= `${analysis.id}-parameters`;
  analysisPanel.id = `${analysis.id}-panel`;
  for (const [tab, panel] of [[parametersTab, parameters], [analysisTab, analysisPanel]]) {
    tab.id = `${panel.id}-tab`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    tablist.append(tab);
  }
  sidebar.prepend(tablist);
  sidebar.append(analysisPanel);

  function localize() {
    const hebrew = document.documentElement.lang === 'he';
    tablist.setAttribute('aria-label', hebrew ? 'תצוגת הניסוי' : 'Experiment view');
    parametersTab.textContent = hebrew ? 'פרמטרים' : 'Parameters';
    analysisTab.textContent = hebrew ? 'ניתוח' : 'Analysis';
    viewAnalysis.textContent = hebrew ? 'לניתוח' : 'View analysis';
    jumpBack.textContent = hebrew ? 'חזרה לתרשים' : 'Back to diagram';
    prompt.textContent = hebrew ? 'בחרו חלק בתרשים כדי לראות את המשוואות שלו.' : 'Select a part of the diagram to see its equations.';
  }

  let active = parametersTab;
  function updateVisibility() {
    prompt.hidden = !analysis.hidden;
    viewAnalysis.hidden = !stacked.matches || analysis.hidden;
    jumpBack.hidden = !stacked.matches;
  }
  function sync() {
    const desktop = !stacked.matches;
    const inspect = desktop && active === analysisTab;
    layout.classList.toggle('experiment-layout--tabs', desktop);
    layout.classList.toggle('experiment-layout--analysis', inspect);
    tablist.hidden = !desktop;
    parameters.hidden = inspect;
    analysisPanel.hidden = !inspect;
    updateVisibility();
    for (const [tab, panel] of [[parametersTab, parameters], [analysisTab, analysisPanel]]) {
      const selected = active === tab;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (desktop) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
      } else {
        panel.removeAttribute('role');
        panel.removeAttribute('aria-labelledby');
      }
    }
    if (desktop && analysis.parentElement !== analysisPanel) analysisPanel.append(analysis);
    if (!desktop && analysis.previousSibling !== inlinePosition) inlinePosition.after(analysis);
  }

  function select(tab) {
    if (active === tab) return;
    active = tab;
    sync();
    if (tab === analysisTab) analysisPanel.scrollTop = 0;
  }
  parametersTab.addEventListener('click', () => select(parametersTab), { signal });
  analysisTab.addEventListener('click', () => select(analysisTab), { signal });
  tablist.addEventListener('keydown', event => {
    const tab = event.key === 'Home' ? parametersTab : event.key === 'End' ? analysisTab
      : ['ArrowLeft', 'ArrowRight'].includes(event.key) ? (active === parametersTab ? analysisTab : parametersTab) : null;
    if (!tab) return;
    event.preventDefault();
    select(tab);
    tab.focus();
  }, { signal });
  layout.addEventListener('experimentlanguagechange', localize, { signal });
  stacked.addEventListener('change', sync, { signal });
  localize();
  sync();

  return {
    reveal() { select(analysisTab); },
    update: updateVisibility,
    close() {
      updateVisibility();
      select(parametersTab);
    },
  };
}
