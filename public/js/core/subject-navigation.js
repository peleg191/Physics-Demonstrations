import { systems } from '../../fluids/systems.js';
import { demonstrations } from '../registry.js';
import { element, svgElement } from './dom.js';

const subjects = {
  mechanics: {
    title: ['Mechanics', 'מכניקה'],
    icon: 'M5 4h14M12 4l5 10m-9 4a11 11 0 0 0 5 2m5-6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
    topics: [
      [['Projectile Motion', 'תנועה בליסטית'], ['basketball']],
      [['Forces and Friction', 'כוחות וחיכוך'], ['pulley', 'incline', 'elevator', 'friction-stacked', 'friction-table', 'friction-hanging']],
      [['Circular Motion', 'תנועה מעגלית'], ['carousel', 'rotating-tube', 'two-string']],
      [['Work and Energy', 'עבודה ואנרגיה'], ['energy-bowl', 'energy-incline', 'spring-launcher', 'escape-speed']],
      [['Oscillations', 'תנודות'], ['pendulum', 'spring', 'double-spring', 'vertical-spring', 'incline-spring']],
    ],
  },
  fluids: {
    title: ['Fluid Mechanics', 'מכניקת זורמים'],
    icon: 'M3 4v8m18-8v8M3 5h18M3 11h7l2-3 2 3h7m-9 4c1.5 2 2.5 3.2 2.5 4.5a2.5 2.5 0 0 1-5 0c0-1.3 1-2.5 2.5-4.5Z',
    topics: [
      [['Hydrostatics', 'הידרוסטטיקה'], ['pascal', 'buoyancy']],
      [['Fluid Flow', 'זרימת נוזלים'], ['narrowing-pipe', 'descending-pipe', 'bernoulli']],
    ],
  },
};

function navigationIcon(path) {
  const icon = svgElement('svg', {
    viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.75,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
  });
  svgElement('path', { d: path }, icon);
  return icon;
}

const namedLaws = {
  pascal: ['Pascal’s law', 'חוק פסקל'],
  bernoulli: ['Bernoulli’s equation', 'משוואת ברנולי'],
};

function setExpanded(button, content, expanded) {
  button.setAttribute('aria-expanded', String(expanded));
  content.inert = !expanded;
}

function disclosure(label, id, open) {
  const group = element('div', 'subject-group');
  const button = element('button', 'subject-group-toggle', label);
  button.type = 'button';
  button.setAttribute('aria-controls', id);
  const panel = element('div', 'subject-panel');
  panel.id = id;
  const content = element('div', 'subject-panel-content');
  panel.append(content);
  group.append(button, panel);
  setExpanded(button, panel, open);
  button.addEventListener('click', () => {
    setExpanded(button, panel, button.getAttribute('aria-expanded') !== 'true');
  });
  return { group, button, panel, content };
}

const desktop = matchMedia('(min-width: 1100px)');
const sidebarPreference = 'physics-subject-sidebar-minimized';
// The sidebar starts expanded until the user saves a preference.
let minimized = false;
try { minimized = localStorage.getItem(sidebarPreference) === 'true'; } catch { /* Storage is optional. */ }

function updateMenuAvailability() {
  const toggle = document.querySelector('.subject-toggle');
  const menu = document.querySelector('#subject-menu');
  if (toggle && menu) {
    const onDemo = Boolean(menu.closest('[data-subject-demo]'));
    menu.inert = desktop.matches ? minimized : onDemo || toggle.getAttribute('aria-expanded') !== 'true';
  }
}

desktop.addEventListener('change', updateMenuAvailability);

export function renderSubjectNavigation({ subject, demoId, lang }) {
  const sidebar = document.querySelector('#subject-sidebar');
  sidebar.toggleAttribute('data-subject-demo', Boolean(demoId));
  const translate = labels => labels[lang === 'he' ? 1 : 0];
  const label = translate(['Subjects', 'נושאים']);
  const minimize = element('button', 'subject-minimize');
  minimize.type = 'button';
  minimize.setAttribute('aria-controls', 'subject-menu');
  minimize.append(navigationIcon('m11 7-5 5 5 5m6-10-5 5 5 5'));
  const rail = element('nav', 'subject-rail');
  rail.setAttribute('aria-label', label);
  const toggle = element('button', 'button secondary subject-toggle', label);
  toggle.type = 'button';
  toggle.prepend(navigationIcon('M5 6h14M5 12h14M5 18h9'));
  toggle.setAttribute('aria-controls', 'subject-menu');
  toggle.setAttribute('aria-expanded', 'false');
  const menu = element('div', 'subject-panel subject-menu-panel');
  menu.id = 'subject-menu';
  const menuContent = element('div', 'subject-panel-content');
  const nav = element('nav', 'subject-menu');
  nav.setAttribute('aria-label', label);
  menuContent.append(nav);
  menu.append(menuContent);

  function link(text, href, current) {
    const anchor = element('a', '', text);
    anchor.href = href;
    if (current) anchor.setAttribute('aria-current', 'page');
    return anchor;
  }

  for (const [key, { title, icon, topics }] of Object.entries(subjects)) {
    const isCurrent = key === subject;
    const isMechanics = key === 'mechanics';
    const base = isCurrent ? '' : isMechanics ? '../' : './fluids/';
    const shortcut = element('button');
    shortcut.type = 'button';
    shortcut.title = translate(title);
    shortcut.setAttribute('aria-label', shortcut.title);
    if (isCurrent) shortcut.setAttribute('aria-current', 'true');
    shortcut.append(navigationIcon(icon));
    rail.append(shortcut);
    const section = disclosure(translate(title), `subject-${key}`, isCurrent);
    const heading = section.button;
    heading.prepend(navigationIcon(icon));
    if (isCurrent) heading.setAttribute('aria-current', 'true');
    shortcut.addEventListener('click', () => {
      setMinimized(false);
      setExpanded(heading, section.panel, true);
      heading.focus({ preventScroll: true });
    });
    section.content.append(link(translate(['Overview', 'סקירה']), base + '#/', isCurrent && !demoId));
    for (const [topicTitle, ids] of topics) {
      const topic = disclosure(translate(topicTitle), `subject-topic-${ids[0]}`, isCurrent && ids.includes(demoId));
      for (const id of ids) {
        const demoTitle = isMechanics
          ? demonstrations.find(entry => entry.id === id).title[lang]
          : translate(namedLaws[id] || systems[id].title);
        const hash = isMechanics ? '#/' + id : '#' + id;
        topic.content.append(link(demoTitle, base + hash, isCurrent && id === demoId));
      }
      section.content.append(topic.group);
    }
    nav.append(section.group);
  }

  toggle.addEventListener('click', () => {
    setExpanded(toggle, menu, toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', event => {
    const anchor = event.target.closest('a');
    if (!anchor || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!desktop.matches && toggle.getAttribute('aria-expanded') === 'true') {
      toggle.focus();
      setExpanded(toggle, menu, false);
    }
  });
  function updateSidebar() {
    sidebar.closest('.subject-layout').toggleAttribute('data-sidebar-minimized', minimized);
    const action = translate(minimized ? ['Expand sidebar', 'הרחבת סרגל הניווט'] : ['Minimize sidebar', 'מזעור סרגל הניווט']);
    minimize.title = action;
    minimize.setAttribute('aria-label', action);
    minimize.setAttribute('aria-expanded', String(!minimized));
    updateMenuAvailability();
  }
  function setMinimized(next) {
    minimized = next;
    try { localStorage.setItem(sidebarPreference, String(minimized)); } catch { /* Storage is optional. */ }
    updateSidebar();
  }
  minimize.addEventListener('click', () => setMinimized(!minimized));
  sidebar.replaceChildren(minimize, toggle, menu, rail);
  updateSidebar();
}
