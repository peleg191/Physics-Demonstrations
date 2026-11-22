const continuity = ['At fixed inlet conditions, the volume flow rate $Q$ is fixed. A larger outlet cross-sectional area $A_2$ gives a smaller outlet speed $v_2$.', 'כאשר תנאי הכניסה קבועים, הספיקה הנפחית $Q$ קבועה. שטח חתך יציאה $A_2$ גדול יותר נותן גודל מהירות יציאה קטן יותר.'];
const height = ['At fixed radii and inlet speed $v_1$ the outlet speed $v_2$ stays fixed. A larger elevation drop $\\Delta z$ adds more pressure through the gravitational term.', 'כשהרדיוסים וגודל מהירות הכניסה $v_1$ קבועים, גודל מהירות היציאה $v_2$ נשאר קבוע. הפרש גבהים $\\Delta z$ גדול יותר מגדיל את תרומת איבר הכבידה ללחץ.'];
const horizontalPressure = ['At equal heights, a smaller outlet speed $v_2$ means a smaller pressure drop.', 'בגובה זהה, גודל מהירות יציאה קטן יותר פירושו ירידת לחץ קטנה יותר.'];
const drops = [['It decreases', 'It increases', 'It stays the same'], ['הוא קטן', 'הוא גדל', 'הוא נשאר קבוע']];
const rises = drops.map(([lower, higher, same]) => [higher, lower, same]);

const common = [
  ['continuity', ['What quantity is the same at both cross-sections?', 'איזה גודל שווה בשני החתכים?'],
    ['Volume flow rate $Q$', 'Flow speed', 'Static pressure'], ['הספיקה הנפחית $Q$', 'גודל מהירות הזרימה', 'הלחץ הסטטי'],
    ['In steady incompressible flow, the same volume crosses both sections each second.', 'בזרימה יציבה של נוזל בלתי דחיס, אותו נפח עובר דרך שני החתכים בכל שנייה.']],
  ['continuity', ['At fixed inlet conditions, double the outlet radius $R_2$. How does the outlet speed $v_2$ change?', 'מכפילים את רדיוס היציאה $R_2$ בלי לשנות את תנאי הכניסה. כיצד ישתנה גודל מהירות היציאה $v_2$?'],
    ['It falls to one quarter', 'It falls to one half', 'It doubles'], ['הוא קטן לרבע', 'הוא קטן לחצי', 'הוא מוכפל'],
    ['Doubling a circular radius quadruples the area. The same flow rate $Q$ then requires one quarter of the speed.', 'הכפלת רדיוס החתך מגדילה את שטחו פי ארבעה. באותה ספיקה $Q$, גודל המהירות קטן לרבע.']],
  ['pressure', ['Increase the inlet pressure $p_1$ by 20 kPa and keep the speed and geometry fixed. How does the outlet pressure $p_2$ change?', 'מגדילים את לחץ הכניסה $p_1$ ב־20 קילו־פסקל ומשאירים את מהירות הכניסה $v_1$ ואת צורת הצינור קבועות. כיצד ישתנה לחץ היציאה $p_2$?'],
    ['It rises by 20 kPa', 'It falls by 20 kPa', 'It stays the same'], ['הוא גדל ב־20 קילו־פסקל', 'הוא קטן ב־20 קילו־פסקל', 'הוא נשאר קבוע'],
    ['The speed and elevation terms are unchanged, so the pressure difference $\\Delta p$ is unchanged.', 'איברי המהירות והגובה קבועים, ולכן הפרש הלחצים $\\Delta p$ נשאר קבוע.']],
  ['height', ['Which Bernoulli contribution vanishes when both sections are at the same height?', 'איזו תרומה במשוואת ברנולי מתאפסת כאשר שני החתכים באותו גובה?'],
    ['The contribution from the elevation drop $\\Delta z$', 'The pressure difference $\\Delta p$', 'The speed contribution'], ['התרומה של הפרש הגבהים $\\Delta z$', 'הפרש הלחצים $\\Delta p$', 'התרומה של הפרש המהירויות'],
    ['The difference of the two elevation terms is zero at equal heights.', 'כאשר הגבהים שווים, ההפרש בין שני איברי הגובה שווה לאפס.']],
  ['pressure', ['If both sections have the same radius and height, how do the inlet static pressure $p_1$ and outlet static pressure $p_2$ compare?', 'לשני החתכים אותו רדיוס והם באותו גובה. מה הקשר בין הלחץ הסטטי בכניסה $p_1$ ללחץ הסטטי ביציאה $p_2$?'],
    ['They are equal', 'The outlet pressure $p_2$ is higher', 'The outlet pressure $p_2$ is lower'], ['הלחצים שווים', 'לחץ היציאה $p_2$ גדול יותר', 'לחץ היציאה $p_2$ קטן יותר'],
    ['Equal areas give equal speeds, and the elevation terms cancel as well.', 'שטחים שווים נותנים גדלי מהירות שווים, וגם איברי הגובה מתבטלים.']],
  ['height', ['Only the elevation drop $\\Delta z$ changes. What happens to the outlet speed $v_2$ if the inlet speed $v_1$ remains fixed?', 'משנים רק את הפרש הגבהים $\\Delta z$ ושומרים על גודל מהירות הכניסה $v_1$. כיצד משתנה גודל מהירות היציאה $v_2$?'],
    ['It stays the same', 'It increases', 'It decreases'], ['הוא נשאר קבוע', 'הוא גדל', 'הוא קטן'],
    ['Continuity fixes the speed from the inlet speed $v_1$ and the area ratio. Bernoulli accounts for the height change through pressure.', 'משוואת הרציפות קובעת את גודל המהירות לפי גודל מהירות הכניסה $v_1$ ויחס השטחים. איבר הגובה במשוואת ברנולי משנה את הפרש הלחצים $\\Delta p$.']],
];

export const pipeQuestions = {
  'narrowing-pipe': [
    ['continuity', ['Increase the outlet radius $R_2$ from 0.05 m to 0.10 m. How does the outlet speed $v_2$ change?', 'מגדילים את רדיוס היציאה $R_2$ מ־0.05 ל־0.10 מטר. כיצד ישתנה גודל מהירות היציאה $v_2$?'],
      ...drops, continuity],
    ['pressure', ['Increase the outlet radius $R_2$ while keeping the pipe horizontal and the inlet settings fixed. What happens to the outlet pressure $p_2$?', 'מגדילים את רדיוס היציאה $R_2$ בצינור האופקי בלי לשנות את תנאי הכניסה. כיצד ישתנה לחץ היציאה $p_2$?'],
      ...rises, horizontalPressure],
    ['continuity', ['The inlet speed $v_1$ is 5 m/s. The outlet radius $R_2$ is half the inlet radius $R_1$. What is the outlet speed $v_2$?', 'גודל מהירות הכניסה $v_1$ הוא 5 מטר לשנייה, ורדיוס היציאה $R_2$ הוא חצי מרדיוס הכניסה $R_1$. מהו גודל מהירות היציאה $v_2$?'],
      ['20 m/s', '10 m/s', '2.5 m/s'], ['20 מטר לשנייה', '10 מטר לשנייה', '2.5 מטר לשנייה'],
      ['The outlet cross-sectional area $A_2$ is one quarter of the inlet cross-sectional area $A_1$, so the outlet speed $v_2$ is four times the inlet speed $v_1$.', 'שטח חתך היציאה $A_2$ הוא רבע משטח חתך הכניסה $A_1$, ולכן גודל מהירות היציאה $v_2$ גדול פי ארבעה מגודל מהירות הכניסה $v_1$.']],
    ['pressure', ['The inlet pressure $p_1$ is 280 kPa and the narrowing produces a drop of 187.5 kPa. What is the outlet pressure $p_2$?', 'לחץ הכניסה $p_1$ הוא 280 קילו־פסקל, וההיצרות מורידה את הלחץ ב־187.5 קילו־פסקל. מהו לחץ היציאה $p_2$?'],
      ['92.5 kPa', '187.5 kPa', '467.5 kPa'], ['92.5 קילו־פסקל', '187.5 קילו־פסקל', '467.5 קילו־פסקל'],
      ['Subtract the pressure drop from the inlet pressure $p_1$.', 'מחסרים את ירידת הלחץ מלחץ הכניסה $p_1$.']],
    ...common,
  ],
  'descending-pipe': [
    ['continuity', ['Increase the outlet radius $R_2$ while keeping the elevation drop $\\Delta z$ and inlet settings fixed. How does the outlet speed $v_2$ change?', 'מגדילים את רדיוס היציאה $R_2$ בלי לשנות את הפרש הגבהים $\\Delta z$ או את תנאי הכניסה. כיצד ישתנה גודל מהירות היציאה $v_2$?'],
      ...drops, continuity],
    ['height', ['Increase only the elevation drop $\\Delta z$. How does the outlet pressure $p_2$ change?', 'מגדילים רק את הפרש הגבהים $\\Delta z$. כיצד ישתנה לחץ היציאה $p_2$?'],
      ...rises, height],
    ['continuity', ['The inlet speed $v_1$ is 3 m/s, the inlet radius $R_1$ is 0.10 m, and the outlet radius $R_2$ is 0.25 m. What is the outlet speed $v_2$?', 'גודל מהירות הכניסה $v_1$ הוא 3 מטר לשנייה, רדיוס הכניסה $R_1$ הוא 0.10 מטר ורדיוס היציאה $R_2$ הוא 0.25 מטר. מהו גודל מהירות היציאה $v_2$?'],
      ['0.48 m/s', '1.2 m/s', '7.5 m/s'], ['0.48 מטר לשנייה', '1.2 מטר לשנייה', '7.5 מטר לשנייה'],
      ['Multiply the inlet speed $v_1$ by the square of the ratio of inlet radius to outlet radius $R_1/R_2$.', 'מכפילים את גודל מהירות הכניסה $v_1$ בריבוע יחס רדיוס הכניסה $R_1$ לרדיוס היציאה $R_1/R_2$.']],
    ['pressure', ['How do widening and descent contribute to the pressure change $\\Delta p$ in this pipe?', 'כיצד ההתרחבות והירידה בגובה משפיעות על שינוי הלחץ $\\Delta p$ בצינור הזה?'],
      ['Both raise the outlet pressure $p_2$', 'Widening raises it and descent lowers it', 'Both lower the outlet pressure $p_2$'], ['שתיהן מעלות את לחץ היציאה $p_2$', 'ההתרחבות מעלה אותו והירידה מורידה אותו', 'שתיהן מורידות את לחץ היציאה $p_2$'],
      ['Both the kinetic energy per unit volume and the gravitational potential energy per unit volume decrease.', 'גם האנרגיה הקינטית ליחידת נפח וגם האנרגיה הפוטנציאלית הכבידתית ליחידת נפח קטנות.']],
    ...common,
  ],
};

export const pipeExperiments = {
  'narrowing-pipe': [
    ['radius2', .05, .10, 'speed2', continuity],
    ['radius2', .05, .075, 'pressure2', horizontalPressure],
  ],
  'descending-pipe': [
    ['radius2', .15, .25, 'speed2', continuity],
    ['drop', 0, 2.5, 'pressure2', height],
  ],
};

export const pipeDistractors = [
  ['The water density $\\rho$ changes.', 'The inlet pressure $p_1$ changes.'],
  ['צפיפות המים $\\rho$ משתנה.', 'לחץ הכניסה $p_1$ משתנה.'],
];
