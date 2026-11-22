import { latexStep as math } from '../../core/latex.js';

const shared = {
  en: { mass: 'Mass', height: 'Release height', angle: 'Ramp angle', ratio: 'Launch speed / escape speed', planet: 'Planet', mars: 'Mars', earth: 'Earth',
    stiffness: 'Spring stiffness', compression: 'Compression', speed: 'Current speed', finalSpeed: 'Speed at the bottom', escapeSpeed: 'Escape speed',
    launchSpeed: 'Speed at spring release', peak: 'Maximum height', kinetic: 'Kinetic energy', potential: 'Potential energy', total: 'Mechanical energy',
    block: 'Block', craft: 'Spacecraft', close: 'Close', paused: 'Playback paused for analysis.', hint: 'Select the moving body to see the worked solution.' },
  he: { mass: 'מסה', height: 'גובה שחרור', angle: 'זווית המדרון', ratio: 'מהירות השיגור ביחס למהירות הבריחה', planet: 'כוכב לכת', mars: 'מאדים', earth: 'כדור הארץ',
    stiffness: 'קבוע הקפיץ', compression: 'כיווץ', speed: 'מהירות רגעית', finalSpeed: 'מהירות בתחתית המדרון', escapeSpeed: 'מהירות בריחה',
    launchSpeed: 'מהירות בניתוק מהקפיץ', peak: 'גובה מרבי', kinetic: 'אנרגיה קינטית', potential: 'אנרגיה פוטנציאלית', total: 'אנרגיה מכנית',
    block: 'גוף', craft: 'חללית', close: 'סגירה', paused: 'ההדגמה הושהתה לצורך ניתוח.', hint: 'בחרו בגוף הנע כדי לראות את הפתרון.' },
};

export const content = {
  'energy-incline': {
    number: '15',
    title: { en: 'Energy on a frictionless incline', he: 'אנרגיה במדרון חלק' },
    description: { en: 'Release a block from rest and use energy conservation to predict its speed at the bottom.', he: 'משחררים גוף ממנוחה ומחשבים את מהירותו בתחתית המדרון בעזרת שימור אנרגיה.' },
    note: { en: 'The block starts from rest. The track is frictionless and gravitational potential energy is zero at the bottom.', he: 'הגוף מתחיל ממנוחה. המדרון חלק והאנרגיה הפוטנציאלית הכבידתית מתאפסת בתחתיתו.' },
    active: { en: 'Gravitational potential energy converts to kinetic energy as the block descends.', he: 'אנרגיה פוטנציאלית כבידתית מומרת לאנרגיה קינטית בזמן הירידה.' },
    end: { en: 'The block has reached the bottom of the incline.', he: 'הגוף הגיע לתחתית המדרון.' },
    solution: [
      String.raw`E_i=mgh,\qquad E_f=\frac{1}{2}mv_f^2`,
      String.raw`mgh=\frac{1}{2}mv_f^2\quad⇒\quad v_f=\sqrt{2gh}`,
      { en: 'Example with a 5 m release height', he: 'דוגמה מגובה שחרור של 5 מטרים' },
      String.raw`m=5\,\mathrm{kg},\quad h=5\,\mathrm{m},\quad \alpha=30^\circ`,
      String.raw`v_f=\sqrt{2\cdot10\cdot5}=10\,\mathrm{m/s}`,
      { en: 'Check using Newton’s second law and constant acceleration', he: 'בדיקה בעזרת החוק השני של ניוטון ותאוצה קבועה' },
      String.raw`a=g\sin\alpha,\qquad s=\frac{h}{\sin\alpha}`,
      String.raw`v_f^2=2as=2gh`,
    ],
  },
  'escape-speed': {
    number: '16',
    title: { en: 'Escape speed from Mars', he: 'מהירות הבריחה ממאדים' },
    description: { en: 'Launch from Mars or Earth and see how the sign of mechanical energy determines whether a spacecraft escapes.', he: 'משגרים חללית ממאדים או מכדור הארץ ובודקים כיצד סימן האנרגיה המכנית קובע אם החללית תברח.' },
    note: { en: 'The spacecraft coasts radially outward under the gravity of one planet. The view follows the outbound leg up to five planetary radii. At normal playback, one real second equals 1,800 simulated seconds.', he: 'החללית נעה בכיוון רדיאלי בהשפעת הכבידה של כוכב לכת אחד. התצוגה עוקבת אחר ההתרחקות עד למרחק של חמישה רדיוסים ממרכזו. בקצב הרגיל, שנייה אחת בתצוגה שווה ל־1,800 שניות בהדמיה.' },
    bound: { en: 'Negative energy. The spacecraft will turn back at a finite distance.', he: 'האנרגיה שלילית. החללית תעצור במרחק סופי ותתחיל לחזור.' },
    turning: { en: 'The spacecraft has reached its turning point.', he: 'החללית הגיעה לנקודת הימוך.' },
    threshold: { en: 'Zero energy. The speed approaches zero as distance approaches infinity.', he: 'האנרגיה אפס. המהירות שואפת לאפס כשהמרחק שואף לאינסוף.' },
    unbound: { en: 'Positive energy. The spacecraft retains speed even arbitrarily far away.', he: 'האנרגיה חיובית. החללית שומרת על מהירות גם במרחק גדול כרצוננו.' },
    limit: { en: 'End of the displayed range.', he: 'סוף הטווח המוצג.' },
    solution: [
      String.raw`U(r)=-\frac{GMm}{r},\qquad E_i=\frac{1}{2}mv_i^2-\frac{GMm}{R}`,
      { en: 'At the escape threshold both kinetic and potential energy approach zero at infinity.', he: 'בסף הבריחה, האנרגיה הקינטית והאנרגיה הפוטנציאלית שואפות לאפס באינסוף.' },
      String.raw`\frac{1}{2}mv_{\mathrm{esc}}^2-\frac{GMm}{R}=0\quad⇒\quad v_{\mathrm{esc}}=\sqrt{\frac{2GM}{R}}`,
      { en: 'Mars and Earth compared', he: 'השוואה בין מאדים לכדור הארץ' },
      String.raw`M_{\mathrm{Mars}}=6.42\times10^{23}\,\mathrm{kg}`,
      String.raw`R_{\mathrm{Mars}}=3400\,\mathrm{km},\quad G=6.67\times10^{-11}\,\mathrm{N}\,\mathrm{m}^2/\mathrm{kg}^2`,
      String.raw`v_{\mathrm{Mars}}\approx5\,\mathrm{km/s},\qquad v_{\mathrm{Earth}}\approx11\,\mathrm{km/s}`,
      String.raw`\frac{M_{\mathrm{Mars}}}{M_{\mathrm{Earth}}}\approx\frac{1}{10},\qquad \frac{R_{\mathrm{Mars}}}{R_{\mathrm{Earth}}}\approx\frac{1}{2}`,
      String.raw`v_{\mathrm{Mars}}\approx\frac{v_{\mathrm{Earth}}}{\sqrt{5}}\approx\frac{v_{\mathrm{Earth}}}{2.2}`,
    ],
  },
  'spring-launcher': {
    number: '17',
    title: { en: 'Spring launcher and ramp', he: 'משגר קפיץ ומדרון' },
    description: { en: 'Track energy from the compressed spring to the block’s motion and then to its maximum height.', he: 'עוקבים אחר המרת אנרגיית הקפיץ המכווץ לאנרגיית תנועה, ולאחר מכן לאנרגיה פוטנציאלית כבידתית בשיא הגובה.' },
    note: { en: 'The track is frictionless and the bend preserves speed. The spring has a relaxed length of 1.5 m for the animation. The starting values give one numerical case of the symbolic solution.', he: 'המסילה חלקה וגודל המהירות נשמר במעבר למדרון. בהדמיה אורך הקפיץ הרפוי הוא 1.5 מטר. ערכי ההתחלה נותנים דוגמה מספרית אחת לפתרון הסמלי.' },
    active: { en: 'The spring pushes the block along the level track.', he: 'הקפיץ דוחף את הגוף לאורך המסילה האופקית.' },
    coast: { en: 'The block leaves the spring at its relaxed length and coasts toward the ramp.', he: 'הגוף מתנתק מהקפיץ באורכו הרפוי וממשיך לעבר המדרון.' },
    climb: { en: 'As the block climbs, kinetic energy converts to gravitational potential energy.', he: 'בעלייה במדרון האנרגיה הקינטית מומרת לאנרגיה פוטנציאלית כבידתית.' },
    end: { en: 'The block has reached its maximum height.', he: 'הגוף הגיע לגובה המרבי.' },
    solution: [
      { en: 'A. The mass starts from rest with the spring compressed by d from its relaxed length L.', he: 'א. הגוף מתחיל ממנוחה כשהקפיץ מכווץ בשיעור d ביחס לאורכו הרפוי L.' },
      String.raw`E_A=\frac{1}{2}kd^2`,
      { en: 'B. The mass separates when the spring reaches its relaxed length. The level track defines zero gravitational potential energy.', he: 'ב. הגוף מתנתק כשהקפיץ מגיע לאורכו הרפוי. המסילה האופקית קובעת את גובה האפס של האנרגיה הפוטנציאלית הכבידתית.' },
      String.raw`E_B=\frac{1}{2}mv_B^2=E_A\quad⇒\quad v_B=d\sqrt{\frac{k}{m}}`,
      { en: 'C. At maximum height the mass is momentarily at rest.', he: 'ג. בגובה המרבי מהירות הגוף מתאפסת לרגע.' },
      String.raw`E_C=mgh_{\mathrm{max}}=E_B=E_A`,
      String.raw`h_{\mathrm{max}}=\frac{kd^2}{2mg}`,
    ],
  },
};

export function wordsFor(kind, lang) {
  return { ...shared[lang], ...Object.fromEntries(
    Object.entries(content[kind]).filter(([, value]) => value[lang]).map(([key, value]) => [key, value[lang]])
  ) };
}

export function workedSolution(kind, lang) {
  return content[kind].solution.map(step => typeof step === 'string' ? math(step) : { text: step[lang] });
}
