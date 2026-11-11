// Follow-up questions ask for a physical explanation, not a second prediction.
const reasoning = (en, he, optionsEn, optionsHe, explanationEn, explanationHe) => ({
  prompt: { en, he }, options: { en: optionsEn, he: optionsHe }, correct: 0,
  explanation: { en: explanationEn, he: explanationHe },
});
const massSpring = reasoning('Why does the heavier mass take longer to complete an oscillation?', 'מדוע הגדלת המסה מאריכה את זמן המחזור?',
  ['The same spring force acts on more inertia', 'A heavier mass makes the spring less stiff', 'Gravity pulls the heavier mass horizontally'],
  ['באותו העתק פועל אותו כוח מחזיר על מסה גדולה יותר', 'הגדלת המסה מקטינה את קבוע הקפיץ', 'כוח הכובד מושך את הגוף הכבד בכיוון האופקי'],
  'At the same displacement the restoring force is unchanged, but a larger mass has less acceleration and returns more slowly.', 'באותו העתק פועל אותו כוח מחזיר. לפי החוק השני של ניוטון, כשהמסה גדולה יותר גודל התאוצה קטן יותר, ולכן זמן המחזור גדל.');
const amplitude = reasoning('Why does a larger release displacement leave the period unchanged in this model?', 'מדוע הגדלת ההעתק ההתחלתי אינה משנה את זמן המחזור במודל האידאלי?',
  ['The longer journey comes with proportionally stronger restoring acceleration', 'The mass moves at the same speed throughout both runs', 'The spring force does not change with displacement'],
  ['ההעתק והתאוצה המחזירה גדלים באותו יחס', 'גודל מהירות הגוף קבוע וזהה בשני המצבים', 'כוח הקפיץ אינו משתנה עם ההעתק'],
  'The restoring force grows linearly with displacement. The larger excursion is accompanied by greater speed, leaving the period unchanged.', 'הכוח המחזיר יחסי להעתק. כשהמשרעת גדלה, הגוף אמנם עובר דרך ארוכה יותר, אך גם גודל מהירותו גדל, כך שזמן המחזור אינו משתנה.');
const explanations = {
  'spring-2': massSpring, 'double-spring-7': massSpring,
  'spring-4': amplitude, 'double-spring-8': amplitude,
  'spring-8': reasoning('Why does a stiffer spring complete the oscillation sooner?', 'מדוע הגדלת קבוע הקפיץ מקצרת את זמן המחזור?',
    ['It produces greater restoring acceleration at the same displacement', 'It reduces the mass', 'It removes the equilibrium point'], ['באותו העתק פועל כוח מחזיר גדול יותר', 'הוא מקטין את המסה', 'הוא מבטל את נקודת שיווי המשקל'],
    'Greater stiffness gives a stronger force for the same displacement, so velocity changes more quickly.', 'קבוע קפיץ גדול יותר פירושו כוח מחזיר גדול יותר באותו העתק. לכן גודל התאוצה גדל וזמן המחזור קטן.'),
  'pendulum-1': reasoning('Why does a longer pendulum swing more slowly?', 'מדוע מטוטלת ארוכה יותר מתנודדת לאט יותר?',
    ['Its restoring angular acceleration is smaller at the same angle', 'The bob has more mass', 'Gravity disappears farther from the pivot'], ['התאוצה הזוויתית המחזירה קטנה יותר באותה זווית', 'למשקולת יש מסה גדולה יותר', 'הכבידה נעלמת רחוק מנקודת התלייה'],
    'For the same angle, a longer pendulum has a smaller angular acceleration. Its reversal takes longer.', 'באותה זווית הסטייה, גודל התאוצה הזוויתית קטן יותר במטוטלת ארוכה. לכן נדרש זמן רב יותר להשלמת תנודה.'),
  'pendulum-2': reasoning('Why does changing bob mass leave the period unchanged?', 'מדוע שינוי מסת המשקולת אינו משנה את זמן המחזור?',
    ['Gravitational force and inertia increase in the same proportion', 'Gravity does not act on the heavier bob', 'String tension supplies a constant tangential push'], ['כוח הכובד ומסת המשקולת גדלים באותו יחס', 'הכבידה אינה פועלת על המשקולת הכבדה', 'מתיחות החוט מספקת דחיפה משיקית קבועה'],
    'More mass increases both gravitational force and inertia, leaving the angular acceleration at a given angle unchanged.', 'הגדלת מסת המשקולת מגדילה באותו יחס גם את כוח הכובד. המסה מצטמצמת במשוואת התנועה, ולכן התאוצה הזוויתית וזמן המחזור אינם משתנים.'),
  'pendulum-6': reasoning('Why is the period independent of the small release angle in this model?', 'מדוע זמן המחזור אינו תלוי בזווית השחרור בקירוב הזוויות הקטנות?',
    ['The small-angle restoring acceleration grows in proportion to angle', 'The bob has constant speed', 'There is no restoring force'], ['התאוצה המחזירה בזוויות קטנות גדלה ביחס ישר לזווית', 'למשקולת מהירות קבועה', 'אין כוח מחזיר'],
    'In the small-angle approximation, a larger swing has a proportionally stronger restoring acceleration. The period stays the same.', 'בקירוב הזוויות הקטנות, התאוצה המשיקית יחסית לזווית הסטייה. הגדלת זווית השחרור מגדילה גם את גודל המהירות, וזמן המחזור אינו משתנה.'),
  'basketball-3': reasoning('Why is horizontal velocity constant during each flight?', 'מדוע המהירות האופקית נשארת קבועה לאורך כל מעוף הכדור?',
    ['No horizontal force acts after release in this model', 'The hand keeps pushing during flight', 'Gravity acts horizontally at the top'], ['אין כוח אופקי לאחר השחרור במודל זה', 'היד ממשיכה לדחוף לאורך המעוף', 'הכבידה פועלת אופקית בשיא'],
    'Gravity acts vertically. Without air resistance there is no horizontal acceleration, so horizontal velocity is preserved.', 'כוח הכובד פועל בכיוון האנכי בלבד. בהיעדר התנגדות אוויר אין כוח אופקי, ולכן המהירות האופקית נשארת קבועה.'),
  'pulley-7': reasoning('Why does increasing the already heavier right mass increase acceleration?', 'מדוע הגדלה נוספת של מסת הגוף הימני, שכבר כבד יותר, מגדילה את גודל התאוצה?',
    ['The driving imbalance becomes a larger fraction of the total inertia', 'The rope stretches more', 'Tension disappears completely'], ['היחס בין הפרש המסות לסכום המסות גדל', 'החבל נמתח יותר', 'המתיחות נעלמת לחלוטין'],
    'Both driving force and inertia change, but the imbalance grows relative to the total mass. Acceleration approaches free fall from below.', 'תאוצת המערכת תלויה ביחס בין הפרש המסות לסכומן. הגדלת המסה הכבדה מגדילה יחס זה, ולכן גודל התאוצה מתקרב לתאוצת הכובד אך נשאר קטן ממנה.'),
  'incline-6': reasoning('Why do the two masses accelerate equally on the smooth slope?', 'מדוע לשני הגופים אותה תאוצה במדרון החלק, אף שמסותיהם שונות?',
    ['The downhill gravitational force and inertia scale together', 'Both bodies have the same weight', 'The slope pushes both bodies downhill equally'], ['רכיב כוח הכובד במורד ומסת הגוף גדלים באותו יחס', 'לשני הגופים אותו משקל', 'המדרון דוחף את שני הגופים במורד באותו כוח'],
    'A larger mass has a proportionally larger downhill force and inertia, so the acceleration is unchanged.', 'רכיב כוח הכובד במורד יחסי למסה. המסה מצטמצמת בחוק השני של ניוטון, ולכן התאוצה תלויה בזווית המדרון ובתאוצת הכובד בלבד.'),
  'elevator-1': reasoning('Why is the scale reading greater than weight during upward acceleration?', 'מדוע קריאת המאזניים גדולה ממשקל האדם כשהמעלית מאיצה כלפי מעלה?',
    ['Support must exceed weight to produce an upward net force', 'Upward velocity makes gravity stronger', 'The scale measures the net force alone'], ['כוח הנורמל צריך להיות גדול מכוח הכובד כדי שהכוח השקול יפעל כלפי מעלה', 'מהירות כלפי מעלה מחזקת את הכבידה', 'המאזניים מודדים רק את הכוח השקול'],
    'The normal force must balance weight and provide the additional upward resultant needed for acceleration.', 'כדי שהאדם יאיץ כלפי מעלה, כוח הנורמל הפועל עליו צריך להיות גדול מכוח הכובד. המאזניים מודדים את כוח הנורמל, ולכן קריאתם גדולה ממשקל האדם.'),
  'friction-stacked-7': reasoning('Why can the blocks stop accelerating together when the applied force grows?', 'מדוע הגדלת הכוח על הגוף התחתון עלולה לגרום להחלקה בין הגופים?',
    ['Static friction cannot transmit an unlimited force to the upper block', 'All friction disappears during slipping', 'The upper block loses its mass'], ['חיכוך סטטי אינו יכול להעביר כוח בלתי מוגבל לגוף העליון', 'כל החיכוך נעלם בהחלקה', 'הגוף העליון מאבד את מסתו'],
    'Beyond the static-friction limit the lower block slips ahead. Kinetic friction still acts, but no longer enforces a shared acceleration.', 'כשהכוח הדרוש עולה על החיכוך הסטטי המרבי, הגוף התחתון מתחיל להחליק ביחס לעליון. החיכוך הקינטי ממשיך לפעול, אך תאוצות הגופים כבר אינן שוות בהכרח.'),
  'friction-table-7': reasoning('Why does a steeper smooth slope increase the downhill driving force?', 'מדוע מדרון חלק תלול יותר מגדיל את הכוח המניע במורד?',
    ['A larger component of the slope block’s weight lies along the slope', 'The table block becomes lighter', 'Friction is added to the smooth slope'], ['רכיב כוח הכובד המקביל למדרון גדל', 'הגוף שעל השולחן נעשה קל יותר', 'נוסף חיכוך למדרון החלק'],
    'Changing the slope changes the downhill weight component; the table friction and masses are unchanged.', 'הגדלת זווית המדרון מגדילה את רכיב כוח הכובד במורד. המסות וכוח החיכוך בשולחן נשארים קבועים.'),
  'friction-hanging-7': reasoning('Why does stronger slope friction reduce uphill acceleration?', 'מדוע חיכוך חזק יותר במדרון מקטין את התאוצה במעלה?',
    ['During uphill sliding friction points downhill and opposes the drive', 'Friction reduces the hanging mass', 'Friction must point upward because the block moves upward'], ['בהחלקה במעלה החיכוך פועל במורד ומתנגד לכוח המניע', 'החיכוך מקטין את המסה התלויה', 'החיכוך חייב לפעול למעלה כי הגוף נע למעלה'],
    'Kinetic friction opposes relative sliding. Increasing it reduces the resultant driving the linked bodies uphill.', 'בזמן שהגוף מחליק במעלה, החיכוך הקינטי פועל במורד. הגדלת החיכוך מקטינה את הכוח השקול בכיוון המעלה, ולכן התאוצה בכיוון זה קטנה.'),
  'carousel-7': reasoning('Why does a larger string tilt require a greater orbital speed at fixed radius?', 'מדוע הגדלת זווית החוט ביחס לאנך מחייבת גודל מהירות גדול יותר באותו רדיוס?',
    ['It gives more inward force relative to the fixed vertical support', 'Gravity starts acting horizontally', 'The ball needs no inward acceleration'], ['הרכיב האופקי של המתיחות גדל, בעוד הרכיב האנכי ממשיך לאזן את כוח הכובד', 'הכבידה מתחילה לפעול אופקית', 'הכדור אינו זקוק לתאוצה פנימה'],
    'Vertical tension balances weight. A larger tilt increases the inward component relative to that support, requiring more centripetal acceleration.', 'הרכיב האנכי של המתיחות שווה למשקל הכדור. כשהזווית גדלה, הרכיב האופקי גדל, ולכן נדרשת תאוצה צנטריפטלית גדולה יותר. באותו רדיוס, פירוש הדבר הוא גודל מהירות גדול יותר.'),
  'rotating-tube-10': reasoning('Why does a larger radius require more friction at fixed rotation frequency?', 'מדוע רדיוס גדול יותר דורש יותר חיכוך בתדירות סיבוב קבועה?',
    ['The required inward acceleration grows with radius at fixed angular rate', 'A larger radius increases the body’s mass', 'Static friction always equals its maximum'], ['באותה תדירות סיבוב, התאוצה הצנטריפטלית גדלה עם הרדיוס', 'רדיוס גדול יותר מגדיל את מסת הגוף', 'חיכוך סטטי תמיד שווה לערכו המרבי'],
    'A longer circular path is covered in the same time. The increased speed requires a greater inward force supplied by static friction.', 'באותה תדירות, הגוף עובר מסלול ארוך יותר באותו זמן, ולכן גודל מהירותו גדל. גם התאוצה הצנטריפטלית גדלה, ונדרש כוח חיכוך גדול יותר כדי לקיים את התנועה.'),
  'two-string-7': reasoning('Why do both tensions increase when frequency increases at fixed geometry?', 'מדוע הגדלת תדירות הסיבוב מגדילה את שתי המתיחויות כשאורכי החוטים ונקודות החיבור אינם משתנים?',
    ['Inward-force demand increases while vertical balance fixes their difference', 'Both weights increase with speed', 'The lower string starts pushing'], ['הכוח הצנטריפטלי הדרוש גדל, ואילו הפרש המתיחויות נשאר קבוע', 'שני המשקלים גדלים עם המהירות', 'החוט התחתון מתחיל לדחוף'],
    'The sum of the inward components must grow, while vertical equilibrium preserves the tension difference. Both tensions therefore rise.', 'תדירות גבוהה יותר מחייבת סכום מתיחויות גדול יותר כדי לספק את הכוח הצנטריפטלי. משוואת הכוחות האנכית קובעת הפרש מתיחויות קבוע, ולכן שתי המתיחויות גדלות יחד.'),
  'energy-bowl-7': reasoning('Why does a lower release height give a smaller speed at the bottom?', 'מדוע שחרור מגובה נמוך יותר מקטין את גודל המהירות בתחתית הקערה?',
    ['Less gravitational potential energy is available to become kinetic energy', 'The normal force removes energy', 'Gravity becomes weaker near the bottom'], ['פחות אנרגיה פוטנציאלית כבידתית זמינה להפוך לאנרגיה קינטית', 'כוח הנורמל מבצע עבודה שלילית', 'הכבידה נחלשת ליד התחתית'],
    'The bowl is smooth, so the height drop determines the kinetic energy gained. A smaller drop gives less speed.', 'הקערה חלקה והאנרגיה המכנית נשמרת. בשחרור ממנוחה מגובה נמוך יותר, פחות אנרגיה פוטנציאלית מומרת לאנרגיה קינטית, ולכן גודל המהירות בתחתית קטן יותר.'),
};
const wrongFeedback = {
  'spring-2': [['The spring stiffness is unchanged between these runs.', 'Gravity is vertical and balanced by the surface.'], ['קבוע הקפיץ אינו משתנה בין שני המצבים.', 'כוח הכובד פועל כלפי מטה ומאוזן על ידי כוח הנורמל מהמשטח.']],
  'spring-4': [['The mass changes speed throughout each oscillation.', 'Spring force depends on displacement from equilibrium.'], ['גודל מהירות הגוף משתנה במהלך כל תנודה.', 'כוח הקפיץ תלוי בהעתק משיווי המשקל.']],
  'spring-8': [['The mass is unchanged between these runs.', 'The equilibrium point remains where the spring force is zero.'], ['המסה אינה משתנה בין ההפעלות.', 'נקודת שיווי המשקל נשארת במקום שבו כוח הקפיץ אפס.']],
  'pendulum-1': [['Only length changes here, not bob mass.', 'Gravity is uniform throughout this demonstration.'], ['רק האורך משתנה כאן ולא מסת המשקולת.', 'הכבידה אחידה לאורך כל ההדמיה.']],
  'pendulum-2': [['Gravity acts on both bobs.', 'String tension is radial, not a tangential driving force.'], ['הכבידה פועלת על שתי המשקולות.', 'מתיחות החוט רדיאלית ואינה כוח מניע משיקי.']],
  'pendulum-6': [['The bob speeds up and slows down during every swing.', 'A displaced bob still has a tangential restoring force.'], ['המשקולת מאיצה ומאטה בכל תנודה.', 'על משקולת שהוסטה עדיין פועל כוח מחזיר משיקי.']],
  'basketball-3': [['The hand stops exerting force when contact ends.', 'Gravity stays vertical at the top as well as elsewhere.'], ['היד מפסיקה להפעיל כוח כאשר המגע מסתיים.', 'הכבידה נשארת אנכית בשיא וגם בשאר המסלול.']],
  'pulley-7': [['The ideal rope has a fixed length.', 'The upward tension remains nonzero on the descending mass.'], ['לחבל האידאלי אורך קבוע.', 'על המסה היורדת עדיין פועלת מתיחות שאינה אפס כלפי מעלה.']],
  'incline-6': [['Different masses have different weights.', 'The normal force is perpendicular to the smooth slope.'], ['למסות שונות משקלים שונים.', 'כוח הנורמל מאונך למדרון החלק.']],
  'elevator-1': [['Gravity does not change with elevator velocity.', 'A scale measures support force, not the resultant of support and weight.'], ['הכבידה אינה משתנה עם מהירות המעלית.', 'המאזניים מודדים את כוח הנורמל, ולא את סכום כוח הנורמל וכוח הכובד.']],
  'friction-stacked-7': [['Kinetic friction still acts while the blocks slip.', 'The upper block keeps its mass and inertia.'], ['החיכוך הקינטי עדיין פועל כאשר הגופים מחליקים.', 'מסת הגוף העליון אינה משתנה כשהוא מתחיל להחליק.']],
  'friction-table-7': [['Changing the slope angle does not change either mass.', 'The slope stays smooth when its angle changes.'], ['שינוי זווית המדרון אינו משנה אף מסה.', 'המדרון נשאר חלק כאשר זוויתו משתנה.']],
  'friction-hanging-7': [['Changing friction does not change either mass.', 'Kinetic friction opposes relative sliding rather than following it.'], ['שינוי החיכוך אינו משנה אף מסה.', 'החיכוך הקינטי מתנגד להחלקה היחסית ואינו פועל בכיוונה.']],
  'carousel-7': [['Gravity stays vertical; the string supplies horizontal force.', 'A continually changing velocity direction requires inward acceleration.'], ['הכבידה נשארת אנכית; החוט מספק כוח אופקי.', 'שינוי מתמיד בכיוון המהירות מחייב תאוצה לעבר מרכז המסלול.']],
  'rotating-tube-10': [['The body has the same mass at either radius.', 'The static-friction maximum is a limit, not the force in every orbit.'], ['לגוף אותה מסה בשני הרדיוסים.', 'החיכוך הסטטי בפועל נקבע לפי התנועה, ואינו בהכרח שווה לערכו המרבי.']],
  'two-string-7': [['Weight does not change when orbital speed changes.', 'A string can pull but cannot push.'], ['המשקל אינו משתנה כאשר מהירות המסלול משתנה.', 'חוט יכול למשוך אך אינו יכול לדחוף.']],
  'energy-bowl-7': [['The normal is perpendicular to motion and does no work.', 'Gravity is uniform in this model.'], ['כוח הנורמל מאונך לתנועה ואינו מבצע עבודה.', 'הכבידה אחידה במודל זה.']],
};
wrongFeedback['double-spring-7'] = wrongFeedback['spring-2'];
wrongFeedback['double-spring-8'] = wrongFeedback['spring-4'];
const quantities = {
  mass: ['Mass', 'מסה', 'kg'], mass2: ['Right mass', 'מסה ימנית', 'kg'], stiffness: ['Spring stiffness', 'קבוע הקפיץ', 'N/m'],
  amplitude: ['Release displacement', 'העתק התחלתי', 'm'], length: ['Length', 'אורך', 'm'], speed: ['Release speed', 'מהירות התחלתית', 'm/s'],
  angle: ['Angle', 'זווית', '°'], acceleration: ['Upward acceleration', 'תאוצה כלפי מעלה', 'm/s²'], force: ['Applied force', 'כוח חיצוני', 'N'],
  mass1: ['Hanging mass', 'מסה תלויה', 'kg'], friction: ['Friction coefficient', 'מקדם חיכוך', ''],
  mu: ['Friction coefficient', 'מקדם חיכוך', ''], radius: ['Radius', 'רדיוס', 'm'], frequency: ['Frequency', 'תדירות', 'Hz'], releaseAngle: ['Release angle', 'זווית שחרור', '°'],
};
const goals = {
  spring: ['Compare the time for one full oscillation.', 'השוו את זמני המחזור בשני המצבים.'],
  'double-spring': ['Compare the time for one full oscillation.', 'השוו את זמני המחזור בשני המצבים.'],
  pendulum: ['Compare the time for one full swing and return.', 'השוו את זמני המחזור בשני המצבים.'],
  basketball: ['Watch horizontal velocity during each flight.', 'צפו במהירות האופקית לאורך כל מעוף.'],
  pulley: ['Compare how quickly the masses gain speed.', 'השוו את התאוצות של הגופים בשני המצבים.'],
  incline: ['Compare the downhill accelerations.', 'השוו את התאוצות במורד.'],
  elevator: ['Compare the scale reading with weight.', 'השוו את קריאת המאזניים למשקל האדם.'],
  'friction-stacked': ['Watch whether the two blocks keep moving together.', 'צפו אם שני הגופים ממשיכים לנוע יחד.'],
  'friction-table': ['Compare the downhill acceleration.', 'השוו את התאוצה במורד.'],
  'friction-hanging': ['Compare the acceleration uphill.', 'השוו את התאוצה במעלה.'],
  carousel: ['Compare how quickly the ball completes an orbit.', 'השוו כמה מהר הכדור משלים הקפה.'],
  'rotating-tube': ['Compare the friction force readouts.', 'השוו את ערכי כוח החיכוך בשני המצבים.'],
  'two-string': ['Compare the two tension readouts.', 'השוו את המתיחות בכל אחד מהחוטים בשני המצבים.'],
  'energy-bowl': ['Compare speed when the body passes the bottom.', 'השוו את גודל המהירות בתחתית הקערה בשני המצבים.'],
};
export function addExperimentReasoning(banks) {
  let index = 0;
  for (const [system, bank] of Object.entries(banks)) for (const question of bank) {
    if (!question.experiment) continue;
    const source = question.experiment.useQuestionReasoning ? reasoning(
      'Which explanation accounts for your observation?', 'איזה מההסברים הבאים מסביר את תוצאות הניסוי?',
      [question.explanation.en, 'The gravitational acceleration changed between runs.', 'All forces vanished during the motion.'],
      [question.explanation.he, 'תאוצת הכובד השתנתה בין ההפעלות.', 'כל הכוחות נעלמו במהלך התנועה.'],
      question.explanation.en, question.explanation.he) : explanations[question.id];
    if (!source) throw new Error(`Missing experiment explanation: ${question.id}`);
    const feedback = question.experiment.useQuestionReasoning
      ? [['Gravity is unchanged in these runs.', 'Forces still act throughout the observation.'], ['תאוצת הכובד זהה בשני מצבי הניסוי.', 'כוחות ממשיכים לפעול לאורך התצפית.']]
      : wrongFeedback[question.id];
    const offset = index++ % 3, rotate = values => values.slice(offset).concat(values.slice(0, offset));
    question.experiment.reasoning = { ...source, options: { en: rotate(source.options.en), he: rotate(source.options.he) }, correct: (3 - offset) % 3,
      feedback: { en: rotate([source.explanation.en, ...feedback[0]]), he: rotate([source.explanation.he, ...feedback[1]]) },
    };
    const [first, second] = question.experiment.runs;
    const key = Object.keys(first.values).find(key => first.values[key] !== second.values[key]);
    const quantity = system === 'pendulum' && key === 'amplitude' ? ['Release angle', 'זווית שחרור', '°'] : quantities[key];
    if (!quantity) throw new Error(`Missing experiment comparison: ${system}-${key}`);
    question.experiment.change = { label: { en: quantity[0], he: quantity[1] }, unit: quantity[2], values: [first.values[key], second.values[key]] };
    question.experiment.goal = { en: goals[system][0], he: goals[system][1] };
    question.experiment.cyclic = ['spring', 'double-spring', 'pendulum', 'carousel', 'rotating-tube', 'two-string', 'energy-bowl'].includes(system);
    question.experiment.observationFraction = question.experiment.cyclic ? system === 'energy-bowl' ? 0.5 : 0.25 : 1;
  }
}
