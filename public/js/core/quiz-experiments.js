// Presets reset to defaults before applying these changes. Setup copy is shown
// before running; no experiment or parameter change happens without a click.
const setup = (values, en, he) => ({ values, label: { en, he } });
const compare = (first, second) => ({ runs: [first, second] });
export function addQuizExperiments(banks) {
  const attach = (system, index, first, second) => { banks[system][index].experiment = compare(first, second); };
  for (const system of ['spring', 'double-spring']) {
    attach(system, system === 'spring' ? 1 : 6,
      setup({ mass: 2, stiffness: 20, amplitude: 0.5 }, 'Mass 2 kg; each spring stiffness 20 N/m; release 0.5 m right of equilibrium.', 'מסת הגוף 2 ק״ג וקבוע הקפיץ של כל קפיץ 20 ניוטון למטר. משחררים ממנוחה, 0.5 מטר מימין לנקודת שיווי המשקל.'),
      setup({ mass: 8, stiffness: 20, amplitude: 0.5 }, 'Same springs and release; mass 8 kg. Compare the period.', 'מגדילים את מסת הגוף ל־8 ק״ג בלי לשנות את הקפיצים ואת ההעתק ההתחלתי. השוו את זמני המחזור.'));
    attach(system, system === 'spring' ? 3 : 7,
      setup({ mass: 2, stiffness: 20, amplitude: 0.3 }, 'Mass 2 kg; each spring stiffness 20 N/m; release 0.3 m.', 'מסת הגוף 2 ק״ג וקבוע הקפיץ של כל קפיץ 20 ניוטון למטר. משחררים ממנוחה בהעתק התחלתי של 0.3 מטר.'),
      setup({ mass: 2, stiffness: 20, amplitude: 0.6 }, 'Same mass and springs; release 0.6 m. Compare the period.', 'שומרים על אותה מסה ואותם קפיצים, ומגדילים את ההעתק ההתחלתי ל־0.6 מטר. השוו את זמני המחזור.'));
  }
  attach('spring', 7,
    setup({ mass: 2, stiffness: 20, amplitude: 0.5 }, 'Mass 2 kg; stiffness 20 N/m; release 0.5 m.', 'מסת הגוף 2 ק״ג וקבוע הקפיץ 20 ניוטון למטר. משחררים ממנוחה בהעתק התחלתי של 0.5 מטר.'),
    setup({ mass: 2, stiffness: 80, amplitude: 0.5 }, 'Same mass and release; stiffness 80 N/m. Compare the period.', 'מגדילים את קבוע הקפיץ ל־80 ניוטון למטר בלי לשנות את המסה ואת ההעתק ההתחלתי. השוו את זמני המחזור.'));
  attach('pendulum', 0,
    setup({ mass: 1, length: 0.5, amplitude: 10 }, 'Bob 1 kg; length 0.5 m; initial angle 10°.', 'מסת המשקולת 1 ק״ג ואורך המטוטלת 0.5 מטר. משחררים ממנוחה בזווית של 10°.'),
    setup({ mass: 1, length: 2, amplitude: 10 }, 'Same bob and angle; length 2 m. Compare the period.', 'מגדילים את אורך המטוטלת ל־2 מטרים בלי לשנות את המשקולת ואת זווית השחרור. השוו את זמני המחזור.'));
  attach('pendulum', 1,
    setup({ mass: 1, length: 2, amplitude: 10 }, 'Bob 1 kg; length 2 m; initial angle 10°.', 'מסת המשקולת 1 ק״ג ואורך המטוטלת 2 מטרים. משחררים ממנוחה בזווית של 10°.'),
    setup({ mass: 2, length: 2, amplitude: 10 }, 'Same length and angle; bob 2 kg. Compare the period.', 'מגדילים את מסת המשקולת ל־2 ק״ג בלי לשנות את אורך המטוטלת ואת זווית השחרור. השוו את זמני המחזור.'));
  attach('pendulum', 5,
    setup({ mass: 1, length: 2, amplitude: 5 }, 'Bob 1 kg; length 2 m; initial angle 5°.', 'מסת המשקולת 1 ק״ג ואורך המטוטלת 2 מטרים. משחררים ממנוחה בזווית של 5°.'),
    setup({ mass: 1, length: 2, amplitude: 10 }, 'Same bob and length; initial angle 10°. Compare the period in the small-angle model.', 'מגדילים את זווית השחרור ל־10° בלי לשנות את המשקולת ואת האורך. השוו את זמני המחזור בקירוב הזוויות הקטנות.'));
  attach('basketball', 2,
    setup({ speed: 6, angle: 45 }, 'Default heights and hoop distance; release speed 6 m/s at 45°. Watch horizontal velocity.', 'משאירים את הגבהים ואת המרחק לסל בערכי ברירת המחדל. זורקים במהירות התחלתית של 6 מטר לשנייה ובזווית של 45°. עקבו אחר המהירות האופקית.'),
    setup({ speed: 9, angle: 45 }, 'Same setup; release speed 9 m/s. Is horizontal velocity constant during each flight?', 'מגדילים רק את המהירות ההתחלתית ל־9 מטר לשנייה. האם המהירות האופקית משתנה במהלך כל מעוף?'));
  attach('pulley', 6,
    setup({ mass1: 5, mass2: 8 }, 'Left mass 5 kg; right mass 8 kg.', 'מסת הגוף השמאלי 5 ק״ג ומסת הגוף הימני 8 ק״ג.'),
    setup({ mass1: 5, mass2: 12 }, 'Left mass 5 kg; right mass 12 kg. Compare the accelerations.', 'מגדילים את מסת הגוף הימני ל־12 ק״ג, ומשאירים את המסה השמאלית 5 ק״ג. השוו את התאוצות.'));
  attach('incline', 5,
    setup({ mass: 3, angle: 30, staticFriction: 0, kineticFriction: 0 }, 'Smooth 30° slope; mass 3 kg.', 'משחררים גוף שמסתו 3 ק״ג ממנוחה על מדרון חלק בזווית של 30°.'),
    setup({ mass: 9, angle: 30, staticFriction: 0, kineticFriction: 0 }, 'Same smooth slope; mass 9 kg. Compare accelerations.', 'מגדילים את מסת הגוף ל־9 ק״ג בלי לשנות את המדרון. השוו את התאוצות.'));
  attach('elevator', 0,
    setup({ mass: 60, acceleration: 1 }, 'Rider 60 kg; upward acceleration 1 m/s². Compare the scale with weight.', 'מסת הנוסע 60 ק״ג והמעלית מאיצה כלפי מעלה ב־1 מטר לשנייה בריבוע. השוו את קריאת המאזניים למשקל הנוסע.'),
    setup({ mass: 60, acceleration: 3 }, 'Same rider; upward acceleration 3 m/s². Compare the scale with weight again.', 'מגדילים את תאוצת המעלית כלפי מעלה ל־3 מטר לשנייה בריבוע. השוו שוב את קריאת המאזניים למשקל הנוסע.'));
  attach('friction-stacked', 6,
    setup({ force: 30 }, 'Default blocks and friction; applied force 30 N. Watch both velocity graphs.', 'משאירים את המסות ואת מקדמי החיכוך בערכי ברירת המחדל ומפעילים כוח של 30 ניוטון. השוו את גרפי המהירות של שני הגופים.'),
    setup({ force: 180 }, 'Same blocks and friction; force 180 N. Watch for relative slipping.', 'מגדילים את הכוח ל־180 ניוטון בלי לשנות את המסות ואת מקדמי החיכוך. בדקו אם מתחילה החלקה בין הגופים.'));
  attach('friction-table', 6,
    setup({ angle: 20 }, 'Default masses and friction; smooth slope at 20°. Inspect acceleration.', 'משאירים את המסות ואת החיכוך בשולחן בערכי ברירת המחדל, ובוחרים זווית של 20° למדרון החלק. בדקו את התאוצה.'),
    setup({ angle: 50 }, 'Same masses and friction; slope at 50°. Compare the downhill acceleration.', 'מגדילים את זווית המדרון ל־50° בלי לשנות את המסות ואת החיכוך בשולחן. השוו את התאוצה בכיוון המורד.'));
  attach('friction-hanging', 6,
    setup({ mass1: 10, mass2: 3, angle: 30, mu: 0.1, speed: 0 }, 'Slope mass 3 kg; hanging mass 10 kg; slope 30°; friction coefficient 0.1; release from rest; the slope block moves uphill.', 'מסת הגוף שעל המדרון 3 ק״ג ומסת הגוף התלוי 10 ק״ג. זווית המדרון 30° ומקדם החיכוך 0.1. משחררים ממנוחה; הגוף שעל המדרון מתחיל לנוע במעלה.'),
    setup({ mass1: 10, mass2: 3, angle: 30, mu: 0.5, speed: 0 }, 'Same setup; friction coefficient 0.5. Compare the uphill acceleration.', 'מגדילים רק את מקדם החיכוך ל־0.5. השוו את התאוצה בכיוון מעלה המדרון.'));
  attach('carousel', 6,
    setup({ mass: 2, radius: 1, angle: 30 }, 'Mass 2 kg; radius 1 m; string angle 30° from vertical.', 'מסת הכדור 2 ק״ג, רדיוס המסלול 1 מטר וזווית החוט ביחס לאנך 30°.'),
    setup({ mass: 2, radius: 1, angle: 60 }, 'Same mass and radius; string angle 60°. Compare speeds.', 'מגדילים את זווית החוט ביחס לאנך ל־60° בלי לשנות את המסה ואת הרדיוס. השוו את גדלי המהירויות.'));
  attach('rotating-tube', 9,
    setup({ mass: 2, radius: 0.1, friction: 0.6, frequency: 0.5 }, 'Mass 2 kg; friction coefficient 0.6; frequency 0.5 Hz; radius 0.1 m.', 'מסת הגוף 2 ק״ג, מקדם החיכוך הסטטי 0.6, תדירות הסיבוב 0.5 הרץ והרדיוס 0.1 מטר.'),
    setup({ mass: 2, radius: 0.3, friction: 0.6, frequency: 0.5 }, 'Same mass, friction, and frequency; radius 0.3 m. Compare friction forces.', 'מגדילים את הרדיוס ל־0.3 מטר בלי לשנות את המסה, את מקדם החיכוך ואת התדירות. השוו את כוחות החיכוך.'));
  attach('two-string', 6,
    setup({ mass: 2, length: 1, separation: 1, frequency: 1 }, 'Mass 2 kg; each string 1 m; anchor separation 1 m; frequency 1 Hz.', 'מסת הגוף 2 ק״ג, אורך כל חוט 1 מטר והמרחק בין נקודות החיבור 1 מטר. תדירות הסיבוב 1 הרץ.'),
    setup({ mass: 2, length: 1, separation: 1, frequency: 1.5 }, 'Same mass and geometry; frequency 1.5 Hz. Compare both tensions.', 'מגדילים את תדירות הסיבוב ל־1.5 הרץ בלי לשנות את המסה ואת החוטים. השוו את המתיחות בכל אחד מהחוטים.'));
  attach('energy-bowl', 6,
    setup({ mass: 2, radius: 1, releaseAngle: 60 }, 'Mass 2 kg; bowl radius 1 m; release angle 60°. Inspect speed at the bottom.', 'מסת הגוף 2 ק״ג ורדיוס הקערה 1 מטר. משחררים ממנוחה בזווית של 60° ובודקים את גודל המהירות בתחתית.'),
    setup({ mass: 2, radius: 1, releaseAngle: 30 }, 'Same body and bowl; release angle 30°. Compare speed at the bottom.', 'מקטינים את זווית השחרור ל־30° בלי לשנות את הגוף ואת הקערה. השוו את גדלי המהירויות בתחתית.'));
  // Keep exactly two comparisons per system.
  delete banks.spring[7].experiment;
  delete banks.pendulum[5].experiment;
  const additions = [
    ['basketball', 8, { speed: 6, angle: 45 }, { speed: 9, angle: 45 }],
    ['pulley', 3, { mass1: 3, mass2: 5 }, { mass1: 6, mass2: 10 }],
    ['incline', 4, { mass: 3, angle: 20, staticFriction: 0, kineticFriction: 0 }, { mass: 3, angle: 50, staticFriction: 0, kineticFriction: 0 }],
    ['elevator', 8, { mass: 40, acceleration: 2 }, { mass: 80, acceleration: 2 }],
    ['friction-stacked', 7, { force: 20 }, { force: 30 }],
    ['friction-table', 3, { angle: 50, mu: 0.1 }, { angle: 50, mu: 0.3 }],
    ['friction-hanging', 9, { mass1: 2, mass2: 3, angle: 30, mu: 0.1, speed: 0 }, { mass1: 10, mass2: 3, angle: 30, mu: 0.1, speed: 0 }],
    ['carousel', 9, { mass: 2, radius: 1, angle: 30 }, { mass: 2, radius: 2, angle: 30 }],
    ['rotating-tube', 7, { mass: 2, radius: 0.1, friction: 0.4, frequency: 0.5 }, { mass: 2, radius: 0.1, friction: 0.8, frequency: 0.5 }],
    ['two-string', 9, { mass: 2, length: 1, separation: 1, frequency: 1 }, { mass: 4, length: 1, separation: 1, frequency: 1 }],
    ['energy-bowl', 9, { mass: 2, radius: 1, releaseAngle: 60 }, { mass: 4, radius: 1, releaseAngle: 60 }],
  ];
  for (const [system, index, first, second] of additions) {
    const names = {
      mass: ['Mass', 'מסה', 'kg'], mass1: ['Mass 1', 'מסה 1', 'kg'], mass2: ['Mass 2', 'מסה 2', 'kg'],
      speed: ['Initial speed', 'מהירות התחלתית', 'm/s'], angle: ['Angle', 'זווית', '°'],
      staticFriction: ['Static friction coefficient', 'מקדם חיכוך סטטי', ''], kineticFriction: ['Kinetic friction coefficient', 'מקדם חיכוך קינטי', ''],
      acceleration: ['Upward acceleration', 'תאוצה כלפי מעלה', 'm/s²'], force: ['Applied force', 'כוח חיצוני', 'N'],
      mu: ['Friction coefficient', 'מקדם חיכוך', ''], friction: ['Friction coefficient', 'מקדם חיכוך', ''],
      radius: ['Radius', 'רדיוס', 'm'], frequency: ['Frequency', 'תדירות', 'Hz'],
      length: ['String length', 'אורך חוט', 'm'], separation: ['Anchor separation', 'המרחק בין נקודות החיבור', 'm'], releaseAngle: ['Release angle', 'זווית שחרור', '°'],
    };
    const label = (values, language) => Object.entries(values).map(([key, value]) => `${names[key][language]}: ${value} ${names[key][2]}`.trim()).join('; ');
    attach(system, index, setup(first, label(first, 0), label(first, 1)), setup(second, label(second, 0), label(second, 1)));
    banks[system][index].experiment.useQuestionReasoning = true;
  }

}
