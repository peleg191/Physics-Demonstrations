import { buoyancy, hydraulic, pipeFlow, tank } from './models.js';
import { drawBuoyancy, drawHydraulic, drawPipe, drawTank } from './diagrams.js';

const field = (key, label, value, min, max, step, unit = '') => ({ key, label, value, min, max, step, unit });

const continuity = String.raw`v_2 = \left(\frac{R_1}{R_2}\right)^2 v_1`;
const pressureEquation = String.raw`p_2 = p_1 + \frac{1}{2}\rho(v_1^2-v_2^2)`;

function pipeSystem(descending) {
  return {
    title: descending ? ['Widening downhill pipe', 'צינור מתרחב ויורד'] : ['Horizontal narrowing pipe', 'צינור אופקי שהולך ונעשה צר'],
    description: descending
      ? ['Change the outlet radius and the elevation drop. See how slowing down and losing height contribute separately to the pressure rise.',
        'שנו את רדיוס היציאה ואת הפרש הגבהים. בדקו בנפרד כיצד הירידה בגודל המהירות והירידה בגובה תורמות לעליית הלחץ.']
      : ['Change the outlet radius and inlet speed. Compare the flow speed and static pressure before and after the narrowing.',
        'שנו את רדיוס היציאה ואת גודל מהירות הכניסה. השוו בין גודל המהירות ללחץ הסטטי לפני ההיצרות ואחריה.'],
    notes: [
      'Steady, incompressible water flow with negligible energy losses. The inlet radius is 0.10 m, and the water density is 1,000 kg/m³.',
      'המים זורמים בזרימה יציבה, ללא דחיסה ובהזנחת איבודי אנרגיה. רדיוס הכניסה הוא 0.10 מטר וצפיפות המים היא 1,000 ק״ג למ״ק.',
    ],
    fields: [
      field('radius2', ['Outlet radius R₂', 'רדיוס היציאה R₂'], descending ? 0.25 : 0.05, descending ? 0.10 : 0.05, descending ? 0.35 : 0.10, 0.005, 'm'),
      field('speed1', ['Inlet speed v₁', 'גודל מהירות הכניסה v₁'], descending ? 3 : 5, 1, 5, 0.1, 'm/s'),
      field('pressure1', ['Inlet pressure p₁', 'לחץ הכניסה p₁'], descending ? 250 : 280, 200, 350, 1, 'kPa'),
      ...(descending ? [field('drop', ['Elevation drop Δz', 'הפרש הגבהים Δz'], 2.5, 0, 3.5, 0.1, 'm')] : []),
    ],
    metrics: [
      ['speed2', ['Outlet speed', 'גודל מהירות היציאה'], 'm/s'],
      ['pressure2', ['Outlet pressure', 'לחץ היציאה'], 'kPa', 0.001],
      ['pressureChange', ['Pressure change', 'שינוי הלחץ'], 'kPa', 0.001],
      ...(descending ? [
        ['kineticChange', ['Pressure gain from slowing', 'תוספת הלחץ עקב האטת הזרימה'], 'kPa', 0.001],
        ['elevationChange', ['Pressure gain from descent', 'תוספת הלחץ עקב הירידה בגובה'], 'kPa', 0.001],
      ] : []),
    ],
    formulas: [continuity, pressureEquation + (descending ? String.raw` + \rho g\Delta z` : '')],
    playback: 'flow',
    calculate: pipeFlow,
    draw: drawPipe,
    status({ speed2, speed1, pressureChange }) {
      if (Math.abs(pressureChange) < 1e-8) return ['The speed and pressure are equal at the two sections.', 'גודל המהירות והלחץ שווים בשני החתכים.'];
      if (!descending) return ['The narrower section has faster flow and lower static pressure.', 'בחתך הצר גודל המהירות גדול יותר והלחץ הסטטי קטן יותר.'];
      if (Math.abs(speed1 - speed2) < 1e-8) return ['The speed is unchanged. The pressure rises because the pipe descends.', 'גודל המהירות נשאר קבוע. הלחץ עולה בגלל הירידה בגובה.'];
      return ['The water slows in the wider section and the static pressure rises.', 'בחתך הרחב גודל המהירות קטן והלחץ הסטטי עולה.'];
    },
  };
}

export const systems = {
  pascal: {
    name: ['Pascal’s law', 'חוק פסקל'],
    title: ['Hydraulic lift', 'מערכת הידראולית'],
    description: [
      'Change the applied force or the piston areas. How much force does the liquid exert on the load piston?',
      'שנו את הכוח המופעל או את שטחי החתך של הבוכנות. מהו הכוח שהנוזל מפעיל על הבוכנה שנושאת את הגוף?',
    ],
    notes: [
      'The pistons start at the same height, with the load supported at its starting position until the liquid can lift it. During a lift, both pistons displace the same volume. The drawing is schematic and neglects piston weight, friction, and the pressure difference due to the small change in height.',
      'הבוכנות מתחילות באותו גובה, והגוף נשען במקומו עד שכוח הנוזל מספיק להרמתו. בעת ההרמה שתי הבוכנות דוחקות נפחי נוזל שווים. האיור סכמטי ומזניח את משקל הבוכנות, את החיכוך ואת הפרש הלחצים עקב השינוי הקטן בגובה.',
    ],
    fields: [
      field('force', ['Applied force F₁', 'הכוח המופעל F₁'], 20, 0, 100, 1, 'N'),
      field('inputArea', ['Input piston area A₁', 'שטח חתך בוכנת הכניסה A₁'], 10, 5, 40, 1, 'cm²'),
      field('outputArea', ['Load piston area A₂', 'שטח חתך הבוכנה הנושאת את הגוף A₂'], 100, 40, 160, 1, 'cm²'),
      field('mass', ['Load mass M', 'מסת הגוף M'], 15, 1, 50, 1, 'kg'),
    ],
    metrics: [
      ['pressure', ['Added pressure', 'תוספת הלחץ'], 'kPa', 0.001],
      ['outputForce', ['Upward force', 'כוח הנוזל כלפי מעלה'], 'N'],
      ['net', ['Net force (up positive)', 'כוח שקול (מעלה חיובי)'], 'N'],
    ],
    formulas: [
      String.raw`\Delta p = \frac{F_1}{A_1} = \frac{F_2}{A_2}`,
      String.raw`F_{\mathrm{net}} = F_2 - Mg`,
      String.raw`A_1 |\Delta x_1| = A_2 |\Delta x_2|`,
    ],
    calculate: hydraulic,
    draw: drawHydraulic,
    status({ net }) {
      if (Math.abs(net) < 1e-8) return ['The forces on the load balance.', 'הכוחות על הגוף מתאזנים.'];
      return net > 0
        ? ['The applied force is enough to lift the load.', 'הכוח המופעל מספיק כדי להרים את הגוף.']
        : ['The applied force is too small to lift the load.', 'הכוח המופעל קטן מדי מכדי להרים את הגוף.'];
    },
  },
  buoyancy: {
    name: ['Buoyancy', 'כוח הציפה'],
    title: ['Archimedes’ principle', 'חוק ארכימדס'],
    description: [
      'Set the densities and the initial submerged fraction, then release the block. Watch the submerged fraction approach the density ratio when the block floats.',
      'קבעו את הצפיפויות ואת החלק השקוע בתחילת הניסוי ושחררו את הגוף. כשהגוף מתייצב בציפה, השוו בין החלק השקוע מנפחו ליחס הצפיפויות.',
    ],
    notes: [
      'At floating equilibrium, the weight of the displaced liquid equals the weight of the block. If the density ratio is greater than 1, even full immersion gives too little buoyancy and the block sinks. Liquid drag damps the motion.',
      'בשיווי משקל בציפה, משקל הנוזל שנדחה שווה למשקל הגוף. אם יחס הצפיפויות גדול מ־1, כוח הציפה קטן ממשקל הגוף גם כשהוא שקוע כולו, ולכן הוא שוקע. התנגדות הנוזל מרסנת את התנועה.',
    ],
    fields: [
      field('liquidDensity', ['Liquid density', 'צפיפות הנוזל'], 1000, 600, 1400, 25, 'kg/m³'),
      field('blockDensity', ['Block density', 'צפיפות הגוף'], 600, 200, 1600, 25, 'kg/m³'),
      field('volume', ['Block volume', 'נפח הגוף'], 4, 1, 10, 0.5, 'L'),
      field('immersion', ['Initial submerged fraction', 'החלק השקוע בהתחלה'], 100, 0, 100, 1, '%'),
    ],
    metrics: [
      ['immersion', ['Submerged volume / total volume', 'נפח שקוע / נפח כולל'], '%', 100],
      ['densityRatio', ['Block density / liquid density', 'צפיפות הגוף / צפיפות הנוזל'], '%', 100],
      ['displaced', ['Displaced volume', 'נפח הנוזל שנדחה'], 'L'],
      ['upward', ['Buoyant force', 'כוח הציפה'], 'N'],
      ['weight', ['Block weight', 'משקל הגוף'], 'N'],
      ['net', ['Net force (up positive)', 'כוח שקול (מעלה חיובי)'], 'N'],
    ],
    formulas: [
      String.raw`\frac{V_{\mathrm{sub}}}{V_{\mathrm{obj}}} = \frac{\rho_{\mathrm{obj}}}{\rho_{\mathrm{liq}}}\quad(F_B = mg)`,
      String.raw`F_B = \rho_{\mathrm{liq}} V_{\mathrm{sub}} g`,
    ],
    calculate: buoyancy,
    draw: drawBuoyancy,
    status({ net, densityRatio }, { immersion, onBottom, velocity }) {
      if (onBottom) return ['The block sank to the bottom. Buoyancy and the floor’s support now balance its weight.', 'הגוף שקע לקרקעית. כוח הציפה וכוח הנורמל מהקרקעית מאזנים כעת את משקלו.'];
      if (Math.abs(velocity) > 0.003) return velocity < 0
        ? ['The block is rising.', 'הגוף עולה.']
        : ['The block is sinking.', 'הגוף שוקע.'];
      if (Math.abs(net) < 1e-8) {
        return immersion === 1 && densityRatio === 1
          ? ['The fully submerged block is neutrally buoyant.', 'הגוף שקוע כולו וכוח הציפה מאזן את משקלו.']
          : ['The block is at floating equilibrium.', 'הגוף צף בשיווי משקל.'];
      }
      return net > 0
        ? ['If released from rest here, the block starts rising.', 'אם ישחררו את הגוף ממנוחה במצב זה, הוא יתחיל לעלות.']
        : ['If released from rest here, the block starts sinking.', 'אם ישחררו את הגוף ממנוחה במצב זה, הוא יתחיל לשקוע.'];
    },
  },
  'narrowing-pipe': pipeSystem(false),
  'descending-pipe': pipeSystem(true),
  bernoulli: {
    name: ['Bernoulli’s equation', 'משוואת ברנולי'],
    title: ['Water draining from a tank', 'יציאת מים ממכל'],
    description: [
      'Compare the outlet speed with the speed of the falling water surface, then open the outlet to watch both decrease.',
      'השוו בין גודל מהירות היציאה מהפתח לגודל המהירות שבה פני המים יורדים. פתחו את הפתח ובדקו כיצד שתיהן משתנות.',
    ],
    notes: [
      'Points 1 and 2 are both exposed to atmospheric pressure. Bernoulli’s equation and continuity give the outlet speed. The Torricelli approximation applies when the tank area is much larger than the outlet area. The draining animation uses a quasi-steady ideal flow.',
      'בנקודות 1 ו־2 הלחץ אטמוספרי. משוואת ברנולי ומשוואת הרציפות קובעות את גודל מהירות היציאה. קירוב טוריצ׳לי מתאים כאשר שטח פני המים גדול בהרבה משטח הפתח. ההנפשה מתארת זרימה אידאלית שמשתנה בהדרגה עם גובה המים.',
    ],
    fields: [
      field('depth', ['Initial height above outlet h', 'גובה התחלתי של פני המים מעל הפתח h'], 4, 0.5, 6, 0.1, 'm'),
      field('areaRatio', ['Tank to outlet area ratio A₁/A₂', 'יחס השטחים של פני המים והפתח A₁/A₂'], 20, 2, 1000, 1),
    ],
    metrics: [
      ['depth', ['Height above outlet', 'גובה פני המים מעל הפתח'], 'm'],
      ['speed', ['Outlet speed', 'גודל מהירות היציאה'], 'm/s'],
      ['surfaceSpeed', ['Surface descent speed', 'גודל מהירות הירידה של פני המים'], 'm/s'],
      ['approximation', ['Torricelli approximation', 'קירוב טוריצ׳לי'], 'm/s'],
    ],
    formulas: [
      'v_2^2 - v_1^2 = 2gh', 'A_1v_1 = A_2v_2',
      String.raw`v_2 \approx \sqrt{2gh}\quad(A_2/A_1 \to 0)`,
    ],
    calculate: tank,
    draw: drawTank,
  },
};
