// For the original four questions, each pair follows the two incorrect choices
// in display order. These hints address that choice without marking the answer.
const feedback = {
  spring: [
    ['A restoring force opposes displacement, rather than pushing farther away.', 'הכוח המחזיר מכוון לעבר שיווי המשקל, נגד כיוון ההעתק.', 'Being away from equilibrium means the spring is deformed.', 'כשהגוף נמצא מחוץ לנקודת שיווי המשקל, הקפיץ מתוח או מכווץ ולכן מפעיל כוח.'],
    ['More mass means more inertia; the return becomes slower.', 'באותו כוח מחזיר, מסה גדולה יותר מקבלת תאוצה קטנה יותר וזמן המחזור גדל.', 'The period does not grow in direct proportion to mass.', 'זמן המחזור יחסי לשורש המסה, ולא למסה עצמה.'],
    ['A turning point and an equilibrium crossing are different events.', 'נקודת מפנה וחציית שיווי המשקל הן אירועים שונים.', 'Zero force does not erase velocity already acquired.', 'כוח שקול אפס אינו גורם לגוף נע להיעצר.'],
    ['A larger excursion is accompanied by greater speed.', 'סטייה גדולה יותר מלווה במהירות גדולה יותר.', 'A larger restoring force accompanies a proportionally larger excursion.', 'הגדלת ההעתק מגדילה את הכוח המחזיר באותו יחס.'],
  ],
  pendulum: [
    ['The period grows more slowly than the length.', 'זמן המחזור יחסי לשורש אורך המטוטלת, ולא לאורך עצמו.', 'A longer pendulum takes longer to return.', 'למטוטלת ארוכה יותר דרוש זמן רב יותר לחזור.'],
    ['The extra gravitational force comes with extra inertia.', 'הגדלת המסה מגדילה באותו יחס גם את כוח הכובד, ולכן אינה משנה את תאוצת המשקולת באותה זווית.', 'A heavier bob does not receive a larger gravitational acceleration.', 'תאוצת הכובד אינה תלויה במסת המשקולת.'],
    ['The bob reverses direction at the turning point.', 'המשקולת מחליפה כיוון בנקודת המפנה.', 'Potential and kinetic energy change throughout the swing.', 'האנרגיה הפוטנציאלית והקינטית משתנות לאורך התנודה.'],
    ['At a turning point the motion changes direction.', 'בנקודת מפנה התנועה משנה כיוון.', 'The bob must pass through zero velocity before reversing.', 'המשקולת חייבת לעבור דרך מהירות אפס לפני היפוך הכיוון.'],
  ],
  'double-spring': [
    ['A compressed spring pushes while a stretched spring pulls.', 'קפיץ מכווץ דוחף וקפיץ מתוח מושך.', 'Both springs resist displacement from the midpoint.', 'שני הקפיצים מפעילים כוח לעבר נקודת שיווי המשקל.'],
    ['Both springs act for the same displacement; this is not a series arrangement.', 'שני הקפיצים מפעילים כוח על אותו גוף, וכל אחד מהם נמתח או מתכווץ באותו גודל העתק.', 'The second spring adds its own restoring force.', 'הקפיץ השני מוסיף כוח מחזיר משלו.'],
    ['A larger restoring stiffness speeds up the return.', 'קבוע קפיץ אפקטיבי גדול יותר מקצר את זמן המחזור.', 'Adding a restoring spring changes the effective stiffness.', 'גם הקפיץ השני מפעיל כוח מחזיר, ולכן קבוע הקפיץ האפקטיבי משתנה.'],
    ['Check the positive direction and the position of the right wall.', 'בדקו את הכיוון החיובי ואת מיקום הקיר הימני.', 'Displacement is measured from the midpoint, not the left wall.', 'ראשית הצירים נמצאת בנקודת שיווי המשקל שבין הקירות, ולא בקיר השמאלי.'],
  ],
  basketball: [
    ['The ball still moves horizontally at the peak.', 'הכדור עדיין נע אופקית בשיא.', 'No horizontal force acts in this ideal flight.', 'אין כוח אופקי במעוף האידאלי הזה.'],
    ['Zero vertical velocity does not remove gravity.', 'מהירות אנכית אפס אינה מבטלת את הכבידה.', 'While rising, the ball already accelerates downward.', 'כבר בזמן העלייה הכדור מאיץ כלפי מטה.'],
    ['Slowing horizontal motion would require a horizontal opposing force.', 'האטה אופקית הייתה דורשת כוח אופקי מתנגד.', 'Increasing horizontal velocity would require a horizontal resultant.', 'הגדלת המהירות האופקית הייתה דורשת כוח שקול אופקי.'],
    ['Horizontal speed changes range, not the vertical fall time.', 'המהירות האופקית משנה את הטווח ולא את זמן הנפילה האנכית.', 'Compare vertical initial conditions rather than horizontal speeds.', 'השוו תנאי התחלה אנכיים ולא מהירויות אופקיות.'],
  ],
  pulley: [
    ['The taut rope prevents both masses from descending together.', 'החבל המתוח מונע משתי המסות לרדת יחד.', 'A symmetric release has no preferred direction.', 'כשהמסות שוות אין הפרש משקלים שיגרום למערכת להאיץ לאחד הצדדים.'],
    ['The larger weight gives the heavier side a downward resultant.', 'המשקל הגדול יותר נותן לצד הכבד כוח שקול כלפי מטה.', 'Unequal weights can produce a nonzero driving resultant.', 'משקלים שונים יכולים ליצור כוח מניע שקול שאינו אפס.'],
    ['Different path speeds would change the total rope length.', 'מהירויות שונות לאורך המסלולים היו משנות את אורך החבל הכולל.', 'The lighter body cannot move independently of the fixed-length rope.', 'הגוף הקל אינו יכול לנוע באופן בלתי תלוי בחבל שאורכו קבוע.'],
    ['The driving imbalance and the total inertia both double.', 'גם הפרש המשקלים המניע את המערכת וגם המסה הכוללת גדלים פי שניים.', 'The force does not stay fixed when both masses increase.', 'הכוח אינו נשאר קבוע כאשר שתי המסות גדלות.'],
  ],
  incline: [
    ['This is the component perpendicular to the slope.', 'זהו הרכיב המאונך למדרון.', 'The full weight is vertical, rather than parallel to the plane.', 'כוח הכובד פועל אנכית כלפי מטה; רק הרכיב המקביל למדרון פועל לאורכו.'],
    ['The maximum is a limit, not the required force in every resting state.', 'הערך המרבי הוא גבול ולא הכוח הדרוש בכל מצב מנוחה.', 'A downhill weight component must be balanced on a tilted slope.', 'במדרון נטוי יש לאזן את רכיב המשקל במורד.'],
    ['Increasing mass increases both the downhill force and the friction limit.', 'הגדלת המסה מגדילה גם את הכוח במורד וגם את גבול החיכוך.', 'More normal load comes with more downhill weight.', 'הגדלת המסה מגדילה באותו יחס גם את הרכיב המאונך למדרון וגם את הרכיב המקביל לו.'],
    ['Friction acts along the surface, not vertically.', 'חיכוך פועל לאורך המשטח ולא אנכית.', 'Kinetic friction opposes the relative sliding direction.', 'חיכוך קינטי מתנגד לכיוון ההחלקה היחסית.'],
  ],
  elevator: [
    ['Equal normal and weight would give zero acceleration.', 'אילו כוח הנורמל היה שווה לכוח הכובד, תאוצת האדם הייתה אפס.', 'A smaller upward normal gives a downward resultant.', 'כוח נורמל הקטן ממשקל האדם יוצר כוח שקול כלפי מטה.'],
    ['The net force includes weight as well as the scale contact force.', 'הכוח השקול כולל גם את המשקל וגם את כוח המגע.', 'A scale responds to contact force, not acceleration directly.', 'המאזניים מודדים את כוח הנורמל, ולא את התאוצה עצמה.'],
    ['Free fall removes the support load instead of increasing it.', 'בנפילה חופשית האדם והמאזניים נופלים יחד, וכוח הנורמל ביניהם מתאפס.', 'Gravity alone supplies free-fall acceleration.', 'הכבידה לבדה מספקת את תאוצת הנפילה החופשית.'],
    ['The same acceleration requires more force for more mass.', 'אותה תאוצה דורשת כוח גדול יותר במסה גדולה יותר.', 'Greater mass increases support demand rather than reducing it.', 'באותה תאוצה, מסה גדולה יותר מחייבת כוח נורמל גדול יותר.'],
  ],
  'friction-stacked': [
    ['The applied force contacts only the lower block.', 'הכוח החיצוני מופעל רק על הגוף התחתון.', 'The normal is vertical, so it cannot provide horizontal acceleration.', 'כוח הנורמל אנכי ולכן אינו יכול לספק תאוצה אופקית.'],
    ['Static refers to relative sliding at the contact, not motion through the room.', 'המונח חיכוך סטטי מתייחס להיעדר החלקה בין המשטחים, ולא למנוחה ביחס לחדר.', 'Nonzero static friction can accelerate the upper block.', 'חיכוך סטטי שאינו אפס יכול להאיץ את הגוף העליון.'],
    ['Sliding contact can still exert kinetic friction.', 'מגע מחליק עדיין יכול להפעיל חיכוך קינטי.', 'Losing the shared-velocity constraint does not require either body to stop.', 'כשהגופים מתחילים להחליק זה על זה, מהירויותיהם יכולות להיות שונות, אך אין פירוש הדבר שהם נעצרים.'],
    ['A horizontal force does not directly add vertical load.', 'הכוח החיצוני פועל בכיוון האופקי, ולכן אינו מוסיף רכיב כוח בכיוון האנכי.', 'Friction does not determine the supported gravitational load.', 'כוח הנורמל מהרצפה נקבע לפי הכוחות האנכיים, ולא לפי כוח החיכוך האופקי.'],
  ],
  'friction-table': [
    ['Contact alone does not imply friction; one surface is smooth.', 'מגע לבדו אינו מחייב חיכוך; אחד המשטחים חלק.', 'The slope is explicitly smooth in this model.', 'המדרון מוגדר במפורש חלק במודל הזה.'],
    ['The rope links the displacements even when the masses differ.', 'החבל מקשר בין ההעתקים גם כאשר המסות שונות.', 'The tilted path does not remove the fixed-length constraint.', 'המסלול הנטוי אינו מבטל את אילוץ האורך הקבוע.'],
    ['Cancellation of terms does not mean that each term is zero.', 'איברים שווים בסימנים מנוגדים מצטמצמים בחיבור, גם אם כל אחד מהם שונה מאפס.', 'Equal tension comes from the ideal rope, not equal weights.', 'המתיחות שווה בשני צדי החבל משום שהוא אידאלי, ולא משום שמסות הגופים שוות.'],
    ['Friction opposes the table block’s existing sliding.', 'החיכוך מתנגד להחלקה הקיימת של הגוף בשולחן.', 'The rope transmits the effect of friction to the other block.', 'החבל מעביר את השפעת החיכוך לגוף האחר.'],
  ],
  'friction-hanging': [
    ['When sliding reverses, friction must oppose the new direction.', 'כאשר ההחלקה מתהפכת, החיכוך חייב להתנגד לכיוון החדש.', 'Friction acts along the slope rather than vertically.', 'החיכוך פועל לאורך המדרון ולא אנכית.'],
    ['An ideal rope does not imply balanced forces on an accelerating mass.', 'גם בחבל אידאלי, המתיחות אינה בהכרח שווה למשקל של גוף מאיץ.', 'A smaller upward tension would give downward acceleration.', 'מתיחות קטנה יותר כלפי מעלה הייתה נותנת תאוצה כלפי מטה.'],
    ['Acceleration can oppose the current velocity.', 'התאוצה יכולה להיות מנוגדת למהירות הנוכחית.', 'Opposite velocity and acceleration do not require zero friction.', 'מהירות ותאוצה מנוגדות אינן דורשות חיכוך אפס.'],
    ['Static friction adjusts to balance the actual force mismatch.', 'החיכוך הסטטי מתאים את עצמו לאיזון הפרש הכוחות בפועל.', 'The hanging mass can exert tension while the system is at rest.', 'המסה התלויה יכולה ליצור מתיחות כשהמערכת במנוחה.'],
  ],
  carousel: [
    ['Centripetal names the inward resultant rather than an extra interaction.', 'הכוח הצנטריפטלי הוא הכוח השקול לעבר מרכז המסלול, ולא כוח נפרד.', 'Weight is vertical and cannot alone provide the horizontal inward force.', 'המשקל אנכי ואינו יכול לבדו לספק את הכוח האופקי פנימה.'],
    ['Zero acceleration can result from balancing nonzero forces.', 'תאוצה אפס יכולה לנבוע מאיזון כוחות שאינם אפס.', 'Tension is needed both for vertical support and inward acceleration.', 'המתיחות דרושה גם לתמיכה אנכית וגם לתאוצה פנימה.'],
    ['Compare the required inward acceleration with gravity rather than equating speed and acceleration.', 'השוו את התאוצה הדרושה פנימה לכבידה במקום להשוות מהירות לתאוצה.', 'A nonzero steady orbit requires nonzero tangential speed.', 'בתנועה מעגלית ברדיוס שאינו אפס, לגוף יש מהירות משיקית שאינה אפס.'],
    ['The inward demand and inertia both scale with mass.', 'באותה תאוצה צנטריפטלית, הכוח הדרוש יחסי למסת הגוף.', 'Supporting more weight requires greater tension.', 'תמיכה במשקל גדול יותר דורשת מתיחות גדולה יותר.'],
  ],
  'rotating-tube': [
    ['The normal is vertical in this model, not radially inward.', 'כוח הנורמל פועל בכיוון האנכי, ואילו התאוצה הצנטריפטלית במודל זה אופקית.', 'Centripetal is the role of the resultant, not an additional interaction.', 'הכוח הצנטריפטלי הוא הכוח השקול לעבר מרכז המסלול, ולא כוח נפרד.'],
    ['The friction limit is not automatically the actual static friction.', 'כוח החיכוך הסטטי המרבי אינו בהכרח כוח החיכוך הפועל בפועל.', 'Static friction can act on a moving body without relative slip.', 'חיכוך סטטי יכול לפעול על גוף נע ללא החלקה יחסית.'],
    ['Angular frequency and revolutions per second are different quantities.', 'תדירות זוויתית נמדדת ברדיאנים לשנייה, ואילו תדירות נמדדת במספר סיבובים לשנייה.', 'The friction bound first determines angular frequency, not frequency in hertz.', 'גבול החיכוך קובע תחילה תדירות זוויתית ולא תדירות בהרץ.'],
    ['The friction capacity increases along with the required inward force.', 'הגדלת המסה מגדילה באותו יחס גם את כוח החיכוך המרבי וגם את הכוח הצנטריפטלי הדרוש.', 'The greater inertia comes with proportionally greater friction capacity.', 'כשהמסה גדלה, גם כוח הנורמל גדל, ואיתו כוח החיכוך הסטטי המרבי.'],
  ],
  'two-string': [
    ['Use the right triangle made by half the anchor separation and the radius.', 'השתמשו במשולש ישר הזווית שנוצר ממחצית המרחק בין נקודות החיבור ומהרדיוס.', 'The horizontal radius is not generally half the vertical separation.', 'הרדיוס האופקי אינו בדרך כלל מחצית המרחק האנכי.'],
    ['The two strings have equal lengths in this setup.', 'לשני החוטים אורכים שווים במערכת הזאת.', 'A string pulls toward its anchor; it cannot push outward.', 'חוט מושך לעבר נקודת החיבור שלו ואינו יכול לדחוף.'],
    ['The vertical component is only part of each tension.', 'רק הרכיב האנכי של כל מתיחות מופיע במשוואת הכוחות בציר האנכי.', 'Equal tensions would leave weight unbalanced vertically.', 'מתיחויות שוות היו משאירות את המשקל לא מאוזן אנכית.'],
    ['A string cannot supply a compressive force.', 'חוט אינו יכול לספק כוח דחיפה.', 'The sign of a calculated tension cannot reverse gravity.', 'תוצאה שלילית למתיחות מצביעה על הנחה שאינה תקפה; כיוון כוח הכובד אינו משתנה.'],
  ],
  'energy-bowl': [
    ['Height decreases on descent, so gravitational potential energy decreases.', 'הגובה קטן בירידה ולכן האנרגיה הפוטנציאלית הכבידתית קטנה.', 'The normal is perpendicular to motion and does no work.', 'כוח הנורמל מאונך לתנועה ואינו מבצע עבודה.'],
    ['At the bottom the path is still curved and the body is moving.', 'בתחתית המסלול עדיין עקום והגוף נע.', 'Zero tangential acceleration does not imply zero inward acceleration.', 'תאוצה משיקית אפס אינה מחייבת תאוצה פנימה אפס.'],
    ['A normal force can be nonzero while doing no work.', 'כוח נורמל יכול להיות שונה מאפס ועדיין לא לבצע עבודה.', 'Weight and normal need not cancel on a curved path.', 'כוח הכובד וכוח הנורמל אינם בהכרח מאזנים זה את זה בתנועה במסלול מעגלי.'],
    ['Balancing weight alone would not bend the trajectory upward.', 'אילו כוח הנורמל היה שווה לכוח הכובד, לא הייתה תאוצה צנטריפטלית בתחתית.', 'The normal must support weight as well as provide the inward resultant.', 'כוח הנורמל צריך להיות גדול מכוח הכובד כדי שהכוח השקול ייצור את התאוצה הצנטריפטלית.'],
  ],
};
const hints = {
  forces: { en: 'Identify actual interactions, then ask which force components balance and which create acceleration.', he: 'ציירו תרשים כוחות. בדקו אילו רכיבים מאזנים זה את זה ובאילו כיוונים פועל כוח שקול שאינו אפס.' },
  motion: { en: 'Separate velocity from acceleration. On a time graph, distinguish the curve’s height from its slope.', he: 'הבדילו בין מהירות לתאוצה. בגרף כתלות בזמן, שימו לב להבדל בין ערך הפונקציה לבין שיפוע הגרף.' },
  parameters: { en: 'Compare only the parameter that changes. Consider both the driving force and the inertia or constraint.', he: 'בדקו איזה נתון משתנה ואילו נתונים נשארים קבועים. חשבו כיצד השינוי משפיע על הכוחות, על המסה ועל אילוצי התנועה.' },
  energy: { en: 'Track stored energy and kinetic energy. Is there any mechanism adding or removing mechanical energy?', he: 'בדקו כיצד האנרגיה הפוטנציאלית והאנרגיה הקינטית משתנות. האם האנרגיה המכנית נשמרת, או שיש כוח שמוסיף לה או גורע ממנה?' },
};
export function addQuizFeedback(banks) {
  for (const [system, bank] of Object.entries(banks)) {
    for (const [index, question] of bank.entries()) {
      question.hint = hints[question.topic];
      if (question.feedback) continue;
      const entries = feedback[system][index];
      question.feedback = { en: [], he: [] };
      let wrong = 0;
      for (let choice = 0; choice < question.options.en.length; choice++) {
        question.feedback.en.push(choice === question.correct ? question.explanation.en : entries[wrong * 2]);
        question.feedback.he.push(choice === question.correct ? question.explanation.he : entries[wrong * 2 + 1]);
        if (choice !== question.correct) wrong++;
      }
    }
  }
}
