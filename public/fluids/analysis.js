import { createBodyAnalysis } from '../js/core/body-analysis.js';
import { latexStep } from '../js/core/latex.js';
import { targetPositions } from './diagrams.js';
import { g, pipeInletRadius } from './models.js';

function pipeAnalysis(descending) {
  return {
    inlet: {
      title: ['Section 1 · Inlet', 'חתך 1 · כניסה'],
      note: ['The inlet radius and speed determine the volume of water passing through the pipe each second.', 'רדיוס הכניסה וגודל מהירות הכניסה קובעים את נפח המים העובר בצינור בכל שנייה.'],
      equations: () => [String.raw`Q = A_1 v_1 = \pi R_1^2 v_1`],
      reading: ({ speed1, pressure1, flowRate }, f) => [
        String.raw`R_1 = ${f(pipeInletRadius)}\,\mathrm{m}`,
        String.raw`v_1 = ${f(speed1)}\,\mathrm{m}/\mathrm{s}`,
        String.raw`p_1 = ${f(pressure1)}\,\mathrm{kPa}`,
        String.raw`Q = ${f(flowRate * 1000)}\,\mathrm{L}/\mathrm{s}`,
      ],
    },
    outlet: {
      title: ['Section 2 · Outlet', 'חתך 2 · יציאה'],
      note: descending
        ? ['Continuity sets the outlet speed. The decrease in speed and the drop in elevation both contribute to the pressure change.', 'משוואת הרציפות קובעת את גודל מהירות היציאה. הירידה בגודל המהירות והירידה בגובה תורמות שתיהן לשינוי הלחץ.']
        : ['The two sections are at the same height, so the pressure change comes from the change in flow speed.', 'שני החתכים באותו גובה, ולכן שינוי הלחץ נקבע לפי השינוי בגודל מהירות הזרימה.'],
      equations: () => [
        String.raw`A_1v_1 = A_2v_2`,
        String.raw`\Delta p = \frac{1}{2}\rho(v_1^2-v_2^2)` + (descending ? String.raw` + \rho g\Delta z` : ''),
      ],
      reading: ({ speed2, pressure2, kineticChange, elevationChange, pressureChange }, f) => [
        String.raw`v_2 = ${f(speed2)}\,\mathrm{m}/\mathrm{s}`,
        String.raw`p_2 = ${f(pressure2 / 1000)}\,\mathrm{kPa}`,
        ...(descending ? [String.raw`\Delta p = ${f(kineticChange / 1000)} + ${f(elevationChange / 1000)} = ${f(pressureChange / 1000)}\,\mathrm{kPa}`] : []),
      ],
    },
  };
}

const details = {
  'narrowing-pipe': pipeAnalysis(false),
  'descending-pipe': pipeAnalysis(true),
  pascal: {
    input: {
      title: ['Forces on the input piston', 'כוחות על בוכנת הכניסה'],
      note: ['The applied force points down. The added pressure produces an equal upward force on the ideal input piston.', 'הכוח המופעל מכוון כלפי מטה. תוספת הלחץ יוצרת כוח שווה בגודלו כלפי מעלה על בוכנת הכניסה.'],
      equations: () => [String.raw`\Delta p A_1 = F_1`],
      reading: ({ force }, f) => [String.raw`F_1 = ${f(force)}\,\mathrm{N}`],
    },
    load: {
      title: ['Forces on the load and its piston', 'כוחות על הגוף והבוכנה הנושאת אותו'],
      note: ['The fluid force points upward and the weight points downward. Up is positive.', 'כוח הנוזל מכוון כלפי מעלה ומשקל הגוף כלפי מטה. הכיוון החיובי הוא כלפי מעלה.'],
      equations: () => [String.raw`F_2 = \Delta p A_2`, String.raw`F_{\mathrm{net}} = F_2 - Mg`],
      reading: ({ outputForce, mass, net }, f) => [
        String.raw`F_2 = ${f(outputForce)}\,\mathrm{N}`, String.raw`Mg = ${f(mass * g)}\,\mathrm{N}`,
        String.raw`F_{\mathrm{net}} = ${f(net)}\,\mathrm{N}`,
      ],
    },
  },
  buoyancy: {
    block: {
      title: ['Forces on the block', 'כוחות על הגוף'],
      note: ['The pressure forces combine to give an upward buoyant force. The block’s weight acts downward.', 'הכוח השקול של לחצי הנוזל הוא כוח הציפה כלפי מעלה. משקל הגוף פועל כלפי מטה.'],
      equations: ({ support }) => [
        String.raw`F_B = \rho_{\mathrm{liq}} g V_{\mathrm{sub}}`,
        support ? String.raw`F_{\mathrm{net}} = F_B + N - mg` : String.raw`F_{\mathrm{net}} = F_B - mg`,
      ],
      reading: ({ upward, weight, support, net }, f) => [
        String.raw`F_B = ${f(upward)}\,\mathrm{N}`, String.raw`mg = ${f(weight)}\,\mathrm{N}`,
        ...(support ? [String.raw`N = ${f(support)}\,\mathrm{N}`] : []),
        String.raw`F_{\mathrm{net}} = ${f(net)}\,\mathrm{N}`,
      ],
    },
  },
  bernoulli: {
    surface: {
      title: ['Point 1 · Water surface', 'נקודה 1 · פני המים'],
      note: ['Atmospheric pressure acts at the free surface. The water surface descends as flow leaves the tank.', 'הלחץ בפני המים הוא אטמוספרי. פני המים יורדים כאשר מים יוצאים מהמכל.'],
      equations: () => [String.raw`p_1 = p_{\mathrm{atm}}`, String.raw`v_1 = \frac{A_2}{A_1} v_2`],
      reading: ({ depth, surfaceSpeed }, f) => [
        String.raw`h = ${f(depth)}\,\mathrm{m}`, String.raw`v_1 = ${f(surfaceSpeed)}\,\mathrm{m}/\mathrm{s}`,
      ],
    },
    outlet: {
      title: ['Point 2 · Outlet and free jet', 'נקודה 2 · הפתח והסילון'],
      note: ['The outlet and the water surface are both at atmospheric pressure. The jet leaves horizontally, then gravity accelerates it downward.', 'הלחץ בפתח ובפני המים הוא אטמוספרי. הסילון יוצא בכיוון אופקי, ואז כוח הכובד מאיץ אותו כלפי מטה.'],
      equations: () => [
        String.raw`p_2 = p_{\mathrm{atm}}`,
        String.raw`v_2 = \sqrt{\frac{2gh}{1 - (A_2/A_1)^2}}`,
      ],
      reading: ({ speed }, f) => [
        String.raw`v_2 = ${f(speed)}\,\mathrm{m}/\mathrm{s}`, String.raw`g = ${g}\,\mathrm{m}/\mathrm{s}^2`,
      ],
    },
  },
};

export function createHydroAnalysis({ id, stage, parent, signal, translate, paint }) {
  let selected;
  const targets = new Map();
  const panel = createBodyAnalysis({ parent, signal, id: `hydro-${id}-analysis`, onClose() {
    const trigger = targets.get(selected);
    selected = undefined;
    paint();
    trigger?.focus({ preventScroll: true });
  } });
  for (const [key, item] of Object.entries(details[id])) {
    const target = document.createElement('button');
    target.type = 'button';
    target.className = 'hydro-target';
    target.setAttribute('aria-label', translate(item.title));
    target.setAttribute('aria-controls', panel.root.id);
    target.title = translate(item.title);
    target.addEventListener('click', () => {
      selected = selected === key ? undefined : key;
      paint();
      if (selected) panel.root.querySelector('h2').focus({ preventScroll: true });
    }, { signal });
    stage.append(target);
    targets.set(key, target);
  }
  return {
    get selected() { return selected; },
    update(state, reading, format) {
      const positions = targetPositions[id](state);
      for (const [key, target] of targets) {
        const [x, y] = positions[key];
        target.style.left = `${x / 560 * 100}%`;
        target.style.top = `${y / 345 * 100}%`;
        target.setAttribute('aria-expanded', String(key === selected));
      }
      if (!selected) { panel.hide(); return; }
      const item = details[id][selected];
      panel.update({
        title: translate(item.title), close: translate(['Close analysis', 'סגירת הניתוח']),
        axis: translate(item.note), equations: item.equations(reading).map(latexStep),
        numericTitle: translate(['Current values', 'הערכים הנוכחיים']),
        numeric: item.reading(reading, format).map(latexStep),
      });
    },
  };
}
