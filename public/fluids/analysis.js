import { createBodyAnalysis } from '../js/core/body-analysis.js';
import { latexStep } from '../js/core/latex.js';
import { targetPositions } from './diagrams.js';
import { g, pipeInletRadius } from './models.js';
import { fluidComparison } from './comparison.js';

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
        String.raw`v_2 = \left(\frac{R_1}{R_2}\right)^2 v_1`,
        String.raw`\Delta p = \frac{1}{2}\rho\left(v_1^2-v_2^2\right)` + (descending ? String.raw` + \rho g\Delta z` : ''),
        ...(descending ? [String.raw`\Delta z = z_1 - z_2`] : []),
        String.raw`p_2 = p_1 + \Delta p`,
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
      note: ['The applied force points down. The added pressure produces an equal upward force on the ideal input piston and is transmitted to the load piston.', 'הכוח המופעל מכוון כלפי מטה. תוספת הלחץ יוצרת כוח שווה בגודלו כלפי מעלה על בוכנת הכניסה האידאלית ומועברת גם לבוכנת העומס.'],
      equations: () => [String.raw`\Delta p = \frac{F_1}{A_1} = \frac{F_2}{A_2}`],
      reading: ({ force, pressure }, f) => [
        String.raw`F_1 = ${f(force)}\,\mathrm{N}`,
        String.raw`\Delta p = ${f(pressure / 1000)}\,\mathrm{kPa}`,
      ],
    },
    load: {
      title: ['Forces on the load and its piston', 'כוחות על הגוף והבוכנה הנושאת אותו'],
      note: ['The fluid force points upward and the weight points downward. Up is positive.', 'כוח הנוזל מכוון כלפי מעלה ומשקל הגוף כלפי מטה. הכיוון החיובי הוא כלפי מעלה.'],
      equations: () => [
        String.raw`F_2 = \Delta p A_2 = \frac{A_2}{A_1} F_1`,
        String.raw`F_{\mathrm{net}} = F_2 - Mg`,
        ['When the pistons move, the volumes they displace are equal.', 'כאשר הבוכנות נעות, נפחי הנוזל שהן דוחקות שווים.'],
        String.raw`A_1 \lvert\Delta x_1\rvert = A_2 \lvert\Delta x_2\rvert`,
      ],
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
        String.raw`m = \rho_{\mathrm{obj}} V_{\mathrm{obj}}`,
        support ? String.raw`F_{\mathrm{net}} = F_B + N - mg` : String.raw`F_{\mathrm{net}} = F_B - mg`,
        ['At floating equilibrium without support, buoyancy balances the block’s weight. Substituting its mass and canceling gravity gives the submerged fraction.',
          'בשיווי משקל בציפה ללא תמיכה, כוח הציפה מאזן את משקל הגוף. הצבת מסת הגוף וצמצום תאוצת הכובד נותנים את החלק השקוע.'],
        String.raw`F_B = mg = \rho_{\mathrm{obj}} V_{\mathrm{obj}} g`,
        String.raw`\frac{V_{\mathrm{sub}}}{V_{\mathrm{obj}}} = \frac{\rho_{\mathrm{obj}}}{\rho_{\mathrm{liq}}}`,
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
      equations: () => [
        String.raw`p_1 = p_{\mathrm{atm}}`,
        String.raw`A_1v_1 = A_2v_2`,
        String.raw`v_1 = \frac{A_2}{A_1} v_2`,
      ],
      reading: ({ depth, surfaceSpeed }, f) => [
        String.raw`h = ${f(depth)}\,\mathrm{m}`, String.raw`v_1 = ${f(surfaceSpeed)}\,\mathrm{m}/\mathrm{s}`,
      ],
    },
    outlet: {
      title: ['Point 2 · Outlet and free jet', 'נקודה 2 · הפתח והסילון'],
      note: ['The outlet and the water surface are both at atmospheric pressure. The jet leaves horizontally, then gravity accelerates it downward.', 'הלחץ בפתח ובפני המים הוא אטמוספרי. הסילון יוצא בכיוון אופקי, ואז כוח הכובד מאיץ אותו כלפי מטה.'],
      equations: () => [
        String.raw`p_2 = p_{\mathrm{atm}}`,
        String.raw`v_2^2 - v_1^2 = 2gh`,
        String.raw`v_2 = \sqrt{\frac{2gh}{1 - \left(A_2/A_1\right)^2}}`,
        ['For a tank much wider than the outlet, this reduces to Torricelli’s approximation.',
          'כאשר שטח החתך של המכל גדול בהרבה משטח הפתח, מתקבל קירוב טוריצ׳לי.'],
        String.raw`v_2 \approx \sqrt{2gh}\quad\left(A_2/A_1 \to 0\right)`,
      ],
      reading: ({ speed }, f) => [
        String.raw`v_2 = ${f(speed)}\,\mathrm{m}/\mathrm{s}`, String.raw`g = ${g}\,\mathrm{m}/\mathrm{s}^2`,
      ],
    },
  },
};

export function createHydroAnalysis({ id, stage, parent, signal, translate, paint }) {
  const equationSteps = (item, reading) => item.equations(reading).map(step =>
    typeof step === 'string' ? latexStep(step) : { text: translate(step) });
  const selected = new Set();
  let lastTarget;
  const targets = new Map();
  const panel = createBodyAnalysis({ parent, signal, onHighlight: paint, id: `hydro-${id}-analysis`, onClose() {
    selected.clear();
    paint();
    lastTarget?.focus({ preventScroll: true });
  } });
  for (const [key, item] of Object.entries(details[id])) {
    const target = document.createElement('button');
    target.type = 'button';
    target.className = 'hydro-target';
    target.setAttribute('aria-label', translate(item.title));
    target.setAttribute('aria-controls', panel.root.id);
    target.title = translate(item.title);
    target.addEventListener('click', () => {
      lastTarget = target;
      if (selected.has(key)) selected.delete(key);
      else selected.add(key);
      if (selected.size) panel.reveal();
      paint();
    }, { signal });
    stage.append(target);
    targets.set(key, target);
  }
  return {
    selected,
    update(state, reading, format) {
      const positions = targetPositions[id](state);
      for (const [key, target] of targets) {
        const [x, y] = positions[key];
        target.style.left = `${x / 560 * 100}%`;
        target.style.top = `${y / 345 * 100}%`;
        target.setAttribute('aria-pressed', String(selected.has(key)));
      }
      if (!selected.size) { panel.hide(); return; }
      const items = Object.entries(details[id]).filter(([key]) => selected.has(key)).map(([, item]) => item);
      const close = translate(['Close analysis', 'סגירת הניתוח']);
      if (items.length > 1) {
        panel.update({
          title: translate(['Combined analysis', 'ניתוח משולב']), close, equations: [],
          comparison: fluidComparison(id, reading, format, translate),
          groups: items.map(item => ({
            title: translate(item.title),
            steps: [
              { text: translate(item.note) },
              ...equationSteps(item, reading),
            ],
          })),
          numeric: items.flatMap(item => [
            { heading: true, text: translate(item.title) },
            ...item.reading(reading, format).map(latexStep),
          ]),
        });
        return;
      }
      const [item] = items;
      panel.update({
        title: translate(item.title), close,
        axis: translate(item.note), equations: equationSteps(item, reading),
        numeric: item.reading(reading, format).map(latexStep),
      });
    },
  };
}
