import { rotateQuizChoices } from '../js/core/quiz-authoring.js';
import { systems } from './systems.js';
import { pipeQuestions, pipeExperiments, pipeDistractors } from './pipe-questions.js';

const bilingual = ([en, he]) => ({ en, he });
const assess = (prompt, en, he, explanation) => ({
  prompt: bilingual(prompt), options: { en, he }, correct: 0, explanation: bilingual(explanation),
});

const content = {
  ...pipeQuestions,
  pascal: [
    ['pressure', ['Double the force applied to the input piston $F_1$, keeping the input piston area $A_1$ and load piston area $A_2$ fixed. What happens to the added pressure $\\Delta p$?', 'מכפילים את הכוח המופעל $F_1$ בלי לשנות את שטחי הבוכנות. כיצד תשתנה תוספת הלחץ $\\Delta p$?'], ['It doubles', 'It halves', 'It stays the same'], ['היא מוכפלת', 'היא קטנה לחצי', 'היא נשארת קבועה'], ['The pressure increment $\\Delta p$ is the applied force $F_1$ divided by the input area $A_1$.', 'תוספת הלחץ $\\Delta p$ שווה לכוח המופעל על בוכנת הכניסה $F_1$ חלקי שטח החתך של בוכנת הכניסה $A_1$.']],
    ['area', ['Double the load piston area $A_2$ while keeping the applied force on the input piston $F_1$ and its cross-sectional area $A_1$ fixed. What happens to the upward liquid force on the load piston $F_2$?', 'מכפילים את שטח החתך של בוכנת העומס $A_2$ בלי לשנות את תנאי הכניסה. כיצד ישתנה כוח הנוזל כלפי מעלה $F_2$?'], ['It doubles', 'It halves', 'It stays the same'], ['הוא מוכפל', 'הוא קטן לחצי', 'הוא נשאר קבוע'], ['The same added liquid pressure $\\Delta p$ acts over twice the load piston cross-sectional area $A_2$.', 'אותה תוספת לחץ בנוזל $\\Delta p$ פועלת על שטח חתך כפול של הבוכנה הנושאת את הגוף $A_2$.']],
    ['pressure', ['The force applied to the input piston $F_1$ is 20 N and its cross-sectional area $A_1$ is 10 cm². What is the added liquid pressure $\\Delta p$?', 'הכוח המופעל על בוכנת הכניסה $F_1$ הוא 20 ניוטון ושטח החתך שלה $A_1$ הוא 10 סמ״ר. מהי תוספת הלחץ $\\Delta p$?'], ['20 kPa', '2 kPa', '200 kPa'], ['20 קילו־פסקל', '2 קילו־פסקל', '200 קילו־פסקל'], ['10 cm² is 0.001 m², so dividing 20 N by the area gives 20,000 Pa.', 'שטח החתך הוא 0.001 מ״ר. חלוקת הכוח בשטח נותנת 20,000 פסקל.']],
    ['area', ['When the input piston cross-sectional area $A_1$ equals the load piston cross-sectional area $A_2$, how do the input force $F_1$ and the upward liquid force on the load piston $F_2$ compare?', 'שטח החתך של בוכנת הכניסה $A_1$ שווה לשטח החתך של הבוכנה הנושאת את הגוף $A_2$. מה הקשר בין הכוח המופעל $F_1$ לבין כוח הנוזל כלפי מעלה $F_2$?'], ['The forces are equal', 'The upward liquid force on the load piston $F_2$ is always larger', 'The upward liquid force on the load piston $F_2$ is zero'], ['הכוחות שווים בגודלם', 'הכוח כלפי מעלה $F_2$ תמיד גדול יותר', 'הכוח כלפי מעלה $F_2$ שווה לאפס'], ['Equal pressure increments acting on equal areas produce equal forces.', 'תוספת לחץ $\\Delta p$ זהה על שטחים שווים יוצרת כוחות שווים בגודלם.']],
    ['balance', ['The upward liquid force on the load piston $F_2$ is 200 N and the load’s weight $Mg$ is 150 N. What is the net force $F_{\\mathrm{net}}$?', 'כוח הנוזל $F_2$ הוא 200 ניוטון כלפי מעלה ומשקל הגוף $Mg$ הוא 150 ניוטון. מהו הכוח השקול $F_{\\mathrm{net}}$?'], ['50 N upward', '350 N upward', '50 N downward'], ['50 ניוטון כלפי מעלה', '350 ניוטון כלפי מעלה', '50 ניוטון כלפי מטה'], ['Subtract the load’s weight $Mg$ from the upward liquid force on the load piston $F_2$.', 'מחסרים את משקל הגוף $Mg$ מכוח הנוזל כלפי מעלה $F_2$.']],
    ['balance', ['When do the vertical forces on the load and its piston balance?', 'מתי הכוחות האנכיים על הגוף והבוכנה הנושאת אותו מתאזנים?'], ['The upward liquid force on the load piston $F_2$ equals the load’s weight $Mg$', 'The input force $F_1$ equals the load’s weight $Mg$', 'The input piston cross-sectional area $A_1$ must equal the load piston cross-sectional area $A_2$'], ['כוח הנוזל $F_2$ שווה למשקל הגוף $Mg$', 'הכוח המופעל $F_1$ שווה למשקל הגוף $Mg$', 'שטח החתך של בוכנת הכניסה $A_1$ חייב להיות שווה לשטח החתך של הבוכנה הנושאת את הגוף $A_2$'], ['In this ideal model the piston’s own weight is neglected.', 'במודל האידאלי מזניחים את משקל הבוכנה עצמה.']],
    ['area', ['Increase only the input piston cross-sectional area $A_1$. What happens to the upward liquid force on the load piston $F_2$?', 'מגדילים רק את שטח החתך של בוכנת הכניסה $A_1$. כיצד ישתנה כוח הנוזל כלפי מעלה $F_2$?'], ['It decreases', 'It increases', 'It stays fixed'], ['הוא קטן', 'הוא גדל', 'הוא נשאר קבוע'], ['The same input force $F_1$ produces less added pressure $\\Delta p$ over a larger area.', 'אותו כוח המופעל על שטח גדול יותר יוצר תוספת לחץ $\\Delta p$ קטנה יותר.']],
    ['pressure', ['How does the added pressure $\\Delta p$ at the two pistons compare?', 'מה הקשר בין תוספות הלחץ $\\Delta p$ בשתי הבוכנות?'], ['It is the same at both', 'It is larger at the larger piston', 'It is zero at the load piston'], ['תוספת הלחץ $\\Delta p$ זהה בשתיהן', 'תוספת הלחץ $\\Delta p$ גדולה יותר בבוכנה הגדולה', 'תוספת הלחץ $\\Delta p$ בבוכנת העומס היא אפס'], ['Pascal’s law transmits the applied pressure increment $\\Delta p$ throughout the enclosed liquid.', 'לפי חוק פסקל, תוספת הלחץ $\\Delta p$ מועברת לכל חלקי הנוזל הסגור.']],
    ['balance', ['Increase only the load mass $M$. What happens to the net force (with upward defined as positive) $F_{\\mathrm{net}}$?', 'מגדילים רק את מסת הגוף $M$. כיצד ישתנה רכיב הכוח השקול $F_{\\mathrm{net}}$ בכיוון החיובי כלפי מעלה?'], ['It decreases', 'It increases', 'It stays fixed'], ['הוא קטן', 'הוא גדל', 'הוא נשאר קבוע'], ['The upward liquid force on the load piston $F_2$ is unchanged and the load’s weight $Mg$ increases.', 'כוח הנוזל $F_2$ נשאר קבוע ומשקל הגוף $Mg$ גדל.']],
    ['area', ['In an ideal lift, the load piston cross-sectional area $A_2$ is ten times the input piston cross-sectional area $A_1$. What is the load piston travel $\\Delta x_2$ if the input piston travel $\\Delta x_1$ is 10 cm?', 'במערכת אידאלית, שטח בוכנת העומס $A_2$ גדול פי עשרה משטח בוכנת הכניסה $A_1$. מהו מרחק התנועה של הבוכנה הנושאת את הגוף $\\Delta x_2$ אם מרחק תנועת בוכנת הכניסה $\\Delta x_1$ הוא 10 ס״מ?'], ['1 cm', '10 cm', '100 cm'], ['1 ס״מ', '10 ס״מ', '100 ס״מ'], ['Both pistons sweep the same liquid volume, so the larger piston moves one tenth as far.', 'נפח הנוזל שנדחק על ידי שתי הבוכנות שווה, ולכן הבוכנה הגדולה עוברת עשירית מהמרחק.']],
  ],
  buoyancy: [
    ['volume', ['Increase the submerged fraction $V_{\\mathrm{sub}}/V_{\\mathrm{obj}}$ at fixed densities. What happens to the buoyant force $F_B$?', 'מגדילים את החלק השקוע מנפח הגוף $V_{\\mathrm{sub}}/V_{\\mathrm{obj}}$ בלי לשנות את הצפיפויות. כיצד ישתנה כוח הציפה $F_B$?'], ['It increases', 'It decreases', 'It stays the same'], ['הוא גדל', 'הוא קטן', 'הוא נשאר קבוע'], ['A larger submerged volume $V_{\\mathrm{sub}}$ displaces more liquid and increases the weight of the displaced liquid.', 'נפח שקוע $V_{\\mathrm{sub}}$ גדול יותר דוחק יותר נוזל, ולכן משקל הנוזל שנדחה גדל.']],
    ['density', ['Increase the liquid density $\\rho_{\\mathrm{liq}}$ while holding the block at the same submerged volume $V_{\\mathrm{sub}}$. What happens to the buoyant force $F_B$?', 'מגדילים את צפיפות הנוזל $\\rho_{\\mathrm{liq}}$ ושומרים על אותו נפח שקוע $V_{\\mathrm{sub}}$. כיצד ישתנה כוח הציפה $F_B$?'], ['It increases', 'It decreases', 'It stays the same'], ['הוא גדל', 'הוא קטן', 'הוא נשאר קבוע'], ['The same displaced volume $V_{\\mathrm{sub}}$ of a denser liquid weighs more.', 'אותו נפח של נוזל צפוף יותר שוקל יותר.']],
    ['volume', ['A block with total volume $V_{\\mathrm{obj}}$ of 4 L is half submerged. What is the displaced liquid volume $V_{\\mathrm{sub}}$?', 'מחצית מנפח גוף שנפחו הכולל $V_{\\mathrm{obj}}$ הוא 4 ליטרים שקועה בנוזל. מהו נפח הנוזל שנדחה $V_{\\mathrm{sub}}$?'], ['2 L', '4 L', '8 L'], ['2 ליטרים', '4 ליטרים', '8 ליטרים'], ['The displaced liquid volume equals the submerged block volume $V_{\\mathrm{sub}}$.', 'נפח הנוזל שנדחה $V_{\\mathrm{sub}}$ שווה לנפח החלק השקוע.']],
    ['balance', ['A fully submerged block is denser than the liquid. What happens just after release from rest?', 'גוף שקוע כולו בנוזל וצפיפותו גדולה מצפיפות הנוזל $\\rho_{\\mathrm{liq}}$. מה יקרה מיד לאחר השחרור ממנוחה?'], ['It starts sinking', 'It starts rising', 'It stays at rest'], ['הוא מתחיל לשקוע', 'הוא מתחיל לעלות', 'הוא נשאר במנוחה'], ['The displaced liquid weighs less than the fully submerged block.', 'משקל הנוזל שנדחה קטן ממשקל הגוף.']],
    ['density', ['The block density $\\rho_{\\mathrm{obj}}$ is 600 kg/m³ and the liquid density $\\rho_{\\mathrm{liq}}$ is 1,000 kg/m³. What fraction is submerged at floating equilibrium?', 'צפיפות הגוף $\\rho_{\\mathrm{obj}}$ היא 600 ק״ג למ״ק וצפיפות הנוזל $\\rho_{\\mathrm{liq}}$ 1,000 ק״ג למ״ק. איזה חלק מנפחו שקוע כשהוא צף בשיווי משקל?'], ['60%', '40%', '100%'], ['60%', '40%', '100%'], ['The submerged fraction $V_{\\mathrm{sub}}/V_{\\mathrm{obj}}$ at equilibrium is the block density $\\rho_{\\mathrm{obj}}$ divided by the liquid density $\\rho_{\\mathrm{liq}}$.', 'בשיווי משקל החלק השקוע שווה לצפיפות הגוף $\\rho_{\\mathrm{obj}}$ חלקי צפיפות הנוזל $\\rho_{\\mathrm{liq}}$.']],
    ['balance', ['What balances the block’s weight $mg$ when it floats at rest?', 'איזה כוח מאזן את משקל הגוף $mg$ כשהוא צף במנוחה?'], ['The upward buoyant force $F_B$', 'The pressure alone at the surface', 'The weight of all the liquid in the tank'], ['כוח הציפה כלפי מעלה $F_B$', 'הלחץ בפני הנוזל בלבד', 'משקל כל הנוזל במכל'], ['The net force $F_{\\mathrm{net}}$ is zero at floating equilibrium.', 'כשהגוף צף בשיווי משקל, הכוח השקול $F_{\\mathrm{net}}$ שווה לאפס.']],
    ['pressure', ['Why is there an upward pressure force $F_B$ on a fully submerged block?', 'מדוע כוח הציפה $F_B$ שמפעיל לחץ הנוזל על גוף שקוע כולו מכוון כלפי מעלה?'], ['Pressure is greater at the bottom than at the top', 'Pressure is greater at the top', 'Pressure acts upward on every face'], ['הלחץ בתחתית הגוף גדול מהלחץ בראשו', 'הלחץ בראש הגוף גדול יותר', 'הלחץ פועל כלפי מעלה על כל פאה'], ['The deeper bottom face experiences a larger upward force than the downward force on the top face.', 'התחתית עמוקה יותר, ולכן הכוח כלפי מעלה עליה גדול מהכוח כלפי מטה על הפאה העליונה.']],
    ['pressure', ['Move the fully submerged block deeper in a liquid of uniform density. What happens to its buoyant force $F_B$?', 'מורידים גוף שכבר שקוע כולו עמוק יותר בנוזל שצפיפותו אחידה. כיצד ישתנה כוח הציפה $F_B$?'], ['It stays the same', 'It grows', 'It vanishes'], ['הוא נשאר קבוע', 'הוא גדל', 'הוא מתאפס'], ['The pressure on both faces rises, but their difference and the displaced volume $V_{\\mathrm{sub}}$ stay the same.', 'הלחץ על שתי הפאות גדל, אך הפרש הלחצים והנפח שנדחה אינם משתנים.']],
    ['density', ['Increase only the block’s density $\\rho_{\\mathrm{obj}}$ while holding its submerged volume $V_{\\mathrm{sub}}$ fixed. What happens to the buoyant force $F_B$?', 'מגדילים רק את צפיפות הגוף $\\rho_{\\mathrm{obj}}$ ושומרים על אותו נפח שקוע $V_{\\mathrm{sub}}$. כיצד ישתנה כוח הציפה $F_B$?'], ['It stays the same', 'It increases', 'It decreases'], ['הוא נשאר קבוע', 'הוא גדל', 'הוא קטן'], ['The buoyant force $F_B$ depends on the liquid density $\\rho_{\\mathrm{liq}}$ and the displaced volume $V_{\\mathrm{sub}}$.', 'כוח הציפה $F_B$ תלוי בצפיפות הנוזל $\\rho_{\\mathrm{liq}}$ ובנפח הנוזל שנדחה $V_{\\mathrm{sub}}$.']],
    ['balance', ['The block and the liquid have equal densities. What is the net force $F_{\\mathrm{net}}$ when the block is fully submerged?', 'צפיפויות הגוף והנוזל שוות. מהו הכוח השקול $F_{\\mathrm{net}}$ כשכל הגוף שקוע?'], ['Zero', 'Upward', 'Downward'], ['אפס', 'כלפי מעלה', 'כלפי מטה'], ['The submerged block displaces its own weight in liquid.', 'משקל הנוזל שנדחה שווה למשקל הגוף.']],
  ],
  bernoulli: [
    ['height', ['Quadruple the water height above the outlet $h$ at fixed area ratio $A_1/A_2$. How does the outlet speed $v_2$ change?', 'מגדילים פי ארבעה את גובה פני המים מעל הפתח $h$ בלי לשנות את יחס השטחים $A_1/A_2$. כיצד ישתנה גודל מהירות היציאה $v_2$?'], ['It doubles', 'It quadruples', 'It halves'], ['הוא מוכפל', 'הוא גדל פי ארבעה', 'הוא קטן לחצי'], ['At fixed area ratio $A_1/A_2$, the outlet speed $v_2$ is proportional to the square root of the height difference $h$.', 'כאשר יחס השטחים $A_1/A_2$ קבוע, גודל מהירות היציאה $v_2$ פרופורציוני לשורש הפרש הגבהים $h$.']],
    ['continuity', ['Increase the tank-to-outlet area ratio $A_1/A_2$ at the same water height. How does the surface descent speed $v_1$ change?', 'מגדילים את היחס בין שטח פני המים $A_1$ לשטח הפתח $A_2$ בלי לשנות את גובה המים. כיצד ישתנה גודל המהירות שבה פני המים יורדים $v_1$?'], ['It decreases', 'It increases', 'It stays the same'], ['הוא קטן', 'הוא גדל', 'הוא נשאר קבוע'], ['By continuity the surface moves at the outlet speed $v_2$ divided by the area ratio $A_1/A_2$. A larger ratio also makes the exact outlet speed $v_2$ slightly smaller.', 'לפי משוואת הרציפות, גודל מהירות פני המים $v_1$ שווה לגודל מהירות היציאה $v_2$ חלקי יחס השטחים $A_1/A_2$. הגדלת היחס גם מקטינה מעט את גודל מהירות היציאה $v_2$.']],
    ['pressure', ['Why do the pressure terms cancel between the surface and outlet?', 'מדוע איברי הלחץ מתבטלים כשמשווים בין פני המים לפתח?'], ['Both points are exposed to atmospheric pressure $p_{\\mathrm{atm}}$', 'The water pressure is zero everywhere', 'The points are at the same height'], ['שתי הנקודות חשופות ללחץ האטמוספרי $p_{\\mathrm{atm}}$', 'לחץ המים שווה לאפס בכל מקום', 'שתי הנקודות נמצאות באותו גובה'], ['Both points have the same pressure even though they are at different heights.', 'בשתי הנקודות הלחץ שווה אף שהן בגבהים שונים.']],
    ['continuity', ['The water surface area $A_1$ is 20 times the outlet area $A_2$. How do their speed magnitudes compare?', 'שטח פני המים $A_1$ גדול פי עשרים משטח הפתח $A_2$. מה הקשר בין גדלי המהירויות?'], ['Outlet speed $v_2$ is 20 times surface speed $v_1$', 'Surface speed $v_1$ is 20 times outlet speed $v_2$', 'The speed magnitudes are equal'], ['גודל מהירות היציאה $v_2$ גדול פי עשרים מגודל מהירות פני המים $v_1$', 'גודל מהירות פני המים $v_1$ גדול פי עשרים מגודל מהירות היציאה $v_2$', 'גדלי המהירויות שווים'], ['The same volume per second crosses the surface and outlet in the incompressible model.', 'במודל של נוזל בלתי דחיס, אותו נפח ליחידת זמן עובר דרך פני המים והפתח.']],
    ['height', ['The water level drops while the outlet stays open. What happens to outlet speed $v_2$?', 'פני המים יורדים כשהפתח פתוח. כיצד ישתנה גודל מהירות היציאה $v_2$?'], ['It falls', 'It rises', 'It is unchanged'], ['הוא קטן', 'הוא גדל', 'הוא נשאר קבוע'], ['A smaller height difference $h$ gives a smaller outlet speed $v_2$.', 'הפרש גבהים קטן יותר נותן גודל מהירות יציאה קטן יותר.']],
    ['approximation', ['When is the Torricelli approximation most accurate?', 'מתי קירוב טוריצ׳לי מדויק ביותר?'], ['When the outlet area $A_2$ is much smaller than the water surface area $A_1$', 'When the water surface area $A_1$ and the outlet area $A_2$ are almost equal', 'When the surface descends faster than the jet'], ['כששטח הפתח $A_2$ קטן בהרבה משטח פני המים', 'כששטח פני המים $A_1$ ושטח הפתח $A_2$ כמעט שווים', 'כשפני המים יורדים מהר יותר מהסילון'], ['The water surface then descends much more slowly than the exiting water.', 'במצב הזה פני המים יורדים לאט בהרבה מן המים היוצאים מהפתח.']],
    ['height', [String.raw`For a wide tank with a water height above the outlet of $h = 5\,\mathrm{m}$ and gravitational acceleration $g = 10\,\mathrm{m}/\mathrm{s}^2$, what outlet speed $v_2$ does Torricelli give?`, 'במכל רחב הפרש הגבהים $h$ הוא 5 מטרים ותאוצת הכובד $g$ היא 10 מטר לשנייה בריבוע. מהו גודל מהירות היציאה $v_2$ לפי טוריצ׳לי?'], ['10 m/s', '5 m/s', '100 m/s'], ['10 מטר לשנייה', '5 מטר לשנייה', '100 מטר לשנייה'], ['The square root of twice the gravitational acceleration $g$ times the water height above the outlet $h$ is 10 m/s.', 'השורש של פעמיים תאוצת הכובד $g$ כפול הפרש הגבהים $h$ הוא 10 מטר לשנייה.']],
    ['approximation', ['At finite tank-to-outlet area ratio $A_1/A_2$, how does the exact speed compare with the Torricelli approximation?', 'כאשר יחס השטחים $A_1/A_2$ סופי, מה הקשר בין גודל מהירות היציאה המדויק $v_2$ לקירוב טוריצ׳לי?'], ['The exact speed is larger', 'The exact speed is smaller', 'The speeds always match'], ['גודל המהירות המדויק גדול יותר', 'גודל המהירות המדויק קטן יותר', 'גדלי המהירויות תמיד שווים'], ['Bernoulli fixes the difference of the squared speeds. Including the nonzero surface speed $v_1$ increases the outlet speed $v_2$.', 'משוואת ברנולי קובעת את הפרש ריבועי המהירויות. כשמביאים בחשבון את מהירות פני המים $v_1$, גודל מהירות היציאה $v_2$ גדול יותר.']],
    ['pressure', ['Which height enters Bernoulli’s equation for this setup?', 'איזה גובה מופיע במשוואת ברנולי במערכת הזאת?'], ['The height of the water surface above the outlet $h$', 'The height of the outlet above the floor', 'The height of the tank wall'], ['גובה פני המים מעל הפתח $h$', 'גובה הפתח מעל הרצפה', 'גובה דופן המכל'], ['Surface and outlet elevations enter as a difference.', 'הגודל הקובע הוא הפרש הגבהים $h$ בין פני המים לפתח.']],
    ['continuity', ['The outlet speed $v_2$ is 8 m/s and the water surface area $A_1$ is 100 times the outlet area $A_2$. What is the surface descent speed $v_1$?', 'גודל מהירות היציאה $v_2$ הוא 8 מטר לשנייה ושטח פני המים $A_1$ גדול פי מאה משטח הפתח $A_2$. מהו גודל מהירות הירידה של פני המים $v_1$?'], ['0.08 m/s', '0.8 m/s', '8 m/s'], ['0.08 מטר לשנייה', '0.8 מטר לשנייה', '8 מטר לשנייה'], ['Divide the outlet speed $v_2$ by the area ratio $A_1/A_2$.', 'מחלקים את גודל מהירות היציאה $v_2$ ביחס השטחים $A_1/A_2$.']],
  ],
};

const experiments = {
  ...pipeExperiments,
  pascal: [
    ['force', 20, 40, 'pressure', ['The input area $A_1$ stays fixed while the applied force $F_1$ grows.', 'שטח בוכנת הכניסה $A_1$ קבוע והכוח המופעל על בוכנת הכניסה $F_1$ גדל.']],
    ['outputArea', 50, 100, 'outputForce', ['The pressure increment $\\Delta p$ stays fixed and acts on a larger area.', 'תוספת הלחץ $\\Delta p$ קבועה ופועלת על שטח גדול יותר.']],
  ],
  buoyancy: [
    ['immersion', 40, 80, 'upward', ['The block displaces more liquid at the same liquid density $\\rho_{\\mathrm{liq}}$.', 'הגוף דוחק נפח נוזל גדול יותר, וצפיפות הנוזל $\\rho_{\\mathrm{liq}}$ קבועה.']],
    ['liquidDensity', 800, 1200, 'upward', ['The same displaced volume $V_{\\mathrm{sub}}$ has more mass in the denser liquid.', 'לאותו נפח שנדחה יש מסה גדולה יותר כשהנוזל צפוף יותר.'], { immersion: 60 }],
  ],
  bernoulli: [
    ['depth', 1, 4, 'speed', ['At fixed area ratio $A_1/A_2$ the squared outlet speed $v_2$ is proportional to the water height above the outlet $h$.', 'כשיחס השטחים $A_1/A_2$ קבוע, ריבוע גודל מהירות היציאה $v_2$ פרופורציוני לגובה פני המים מעל הפתח $h$.']],
    ['areaRatio', 5, 20, 'surfaceSpeed', ['By continuity, the ratio of outlet speed to surface descent speed $v_2/v_1$ equals the ratio of water surface area to outlet area $A_1/A_2$.', 'לפי משוואת הרציפות, היחס בין גודל מהירות היציאה $v_2$ לגודל מהירות ירידת פני המים $v_2/v_1$ שווה ליחס בין שטח פני המים לשטח הפתח $A_1/A_2$.']],
  ],
};
const distractors = {
  pascal: [['The liquid volume doubles.', 'The load mass $M$ changes.'], ['נפח הנוזל מוכפל.', 'מסת הגוף $M$ משתנה.']],
  buoyancy: [['The block’s weight $mg$ changes.', 'Gravitational acceleration $g$ changes between setups.'], ['משקל הגוף $mg$ משתנה.', 'תאוצת הכובד $g$ משתנה בין המצבים.']],
  bernoulli: [['The two points are at the same height.', 'Atmospheric pressure $p_{\\mathrm{atm}}$ acts only at the outlet.'], ['שתי הנקודות נמצאות באותו גובה.', 'הלחץ האטמוספרי $p_{\\mathrm{atm}}$ פועל רק בפתח.']],
};

const pipeHints = {
  continuity: ['Track the volume flow rate $Q$ through the inlet cross-sectional area $A_1$ and the outlet cross-sectional area $A_2$.', 'עקבו אחר הספיקה הנפחית $Q$ דרך שטח חתך הכניסה $A_1$ ושטח חתך היציאה $A_2$.'],
  pressure: ['Compare the inlet static pressure $p_1$ and outlet static pressure $p_2$ using the inlet speed $v_1$, outlet speed $v_2$, and the two section heights.', 'השוו בין הלחץ הסטטי בכניסה $p_1$ ללחץ הסטטי ביציאה $p_2$ בעזרת גודל מהירות הכניסה $v_1$, גודל מהירות היציאה $v_2$ וגובה כל חתך.'],
  height: ['Check how the elevation drop $\\Delta z$ enters Bernoulli’s equation and which quantities are set by continuity.', 'בדקו כיצד הפרש הגבהים $\\Delta z$ נכנס למשוואת ברנולי ואילו גדלים נקבעים ממשוואת הרציפות.'],
};
const hints = {
  'narrowing-pipe': pipeHints,
  'descending-pipe': pipeHints,
  pascal: {
    pressure: ['Relate the added liquid pressure $\\Delta p$ to the applied force on the input piston $F_1$ and the input piston cross-sectional area $A_1$.', 'קשרו בין תוספת הלחץ בנוזל $\\Delta p$, הכוח המופעל על בוכנת הכניסה $F_1$ ושטח החתך שלה $A_1$.'],
    area: ['Identify the input piston cross-sectional area $A_1$ and the load piston cross-sectional area $A_2$. Decide whether the question compares forces or displaced volumes.', 'זהו את שטח החתך של בוכנת הכניסה $A_1$ ואת שטח החתך של הבוכנה הנושאת את הגוף $A_2$. בדקו אם השאלה משווה כוחות או נפחי נוזל שנדחקו.'],
    balance: ['Compare the upward liquid force on the load piston $F_2$ with the downward weight of the load $Mg$.', 'השוו בין כוח הנוזל כלפי מעלה על הבוכנה הנושאת את הגוף $F_2$ לבין משקל הגוף כלפי מטה $Mg$.'],
  },
  buoyancy: {
    volume: [String.raw`Compare the submerged volume $V_{\mathrm{sub}}$ with the total block volume $V_{\mathrm{obj}}$.`, String.raw`השוו בין נפח החלק השקוע $V_{\mathrm{sub}}$ לנפח הכולל של הגוף $V_{\mathrm{obj}}$.`],
    density: [String.raw`Check which quantities describe the liquid density $\rho_{\mathrm{liq}}$ and the block density $\rho_{\mathrm{obj}}$.`, String.raw`בדקו אילו גדלים מתארים את צפיפות הנוזל $\rho_{\mathrm{liq}}$ ואת צפיפות הגוף $\rho_{\mathrm{obj}}$.`],
    balance: ['Compare the upward buoyant force $F_B$ with the downward block weight $mg$.', 'השוו בין כוח הציפה כלפי מעלה $F_B$ למשקל הגוף כלפי מטה $mg$.'],
    pressure: ['Think about how the pressures on the top and bottom faces combine to give the buoyant force $F_B$.', 'חשבו כיצד הלחצים על הפאה העליונה והתחתונה יוצרים יחד את כוח הציפה $F_B$.'],
  },
  bernoulli: {
    height: ['Relate the outlet speed $v_2$ to the water height above the outlet $h$ and gravitational acceleration $g$.', 'קשרו בין גודל מהירות היציאה $v_2$, גובה פני המים מעל הפתח $h$ ותאוצת הכובד $g$.'],
    continuity: ['Compare the surface descent speed $v_1$ and outlet speed $v_2$ using the ratio of water surface area to outlet area $A_1/A_2$.', 'השוו בין גודל מהירות ירידת פני המים $v_1$ לגודל מהירות היציאה $v_2$ בעזרת היחס בין שטח פני המים לשטח הפתח $A_1/A_2$.'],
    pressure: ['Check the pressure and elevation at each point. Consider the atmospheric pressure and the water height above the outlet $h$.', 'בדקו את הלחץ ואת הגובה בכל נקודה. הביאו בחשבון את הלחץ האטמוספרי ואת גובה פני המים מעל הפתח $h$.'],
    approximation: ['Check when the surface descent speed $v_1$ is small compared with the outlet speed $v_2$.', 'בדקו מתי גודל מהירות ירידת פני המים $v_1$ קטן ביחס לגודל מהירות היציאה $v_2$.'],
  },
};

// Experiment labels are also used in plain-text readouts.
const experimentMetricLabels = {
  pressure: ['Added liquid pressure Δp', 'תוספת הלחץ בנוזל Δp'],
  outputForce: ['Upward liquid force on the load piston F₂', 'כוח הנוזל כלפי מעלה על הבוכנה הנושאת את הגוף F₂'],
  upward: ['Buoyant force F_B', 'כוח הציפה F_B'],
  speed: ['Outlet speed v₂', 'גודל מהירות היציאה v₂'],
  speed2: ['Outlet speed v₂', 'גודל מהירות היציאה v₂'],
  pressure2: ['Outlet static pressure p₂', 'הלחץ הסטטי ביציאה p₂'],
  surfaceSpeed: ['Surface descent speed v₁', 'גודל מהירות הירידה של פני המים v₁'],
};
const experimentFieldLabels = {
  force: ['Force applied to the input piston F₁', 'הכוח המופעל על בוכנת הכניסה F₁'],
  outputArea: ['Load piston cross-sectional area A₂', 'שטח החתך של הבוכנה הנושאת את הגוף A₂'],
  immersion: ['Initial submerged volume fraction V_sub/V_obj', 'החלק השקוע מנפח הגוף בתחילת הניסוי V_sub/V_obj'],
  liquidDensity: ['Liquid density ρ_liq', 'צפיפות הנוזל ρ_liq'],
};
const entries = Object.entries(systems).map(([key, system]) => ({
  id: `hydro-${key}`, key, href: `#${key}`, title: bilingual(system.title),
}));
const banks = Object.fromEntries(entries.map(({ id, key }) => [id, content[key].map(([topic, prompt, en, he, explanation], index) => {
  const question = {
    ...rotateQuizChoices(assess(prompt, en, he, explanation), index % 3),
    id: `${id}-${index + 1}`, topic, hint: bilingual(hints[key][topic]),
  };
  const experiment = experiments[key][index];
  if (experiment) {
    const [parameter, first, second, metricKey, reason, fixed = {}] = experiment;
    const field = systems[key].fields.find(field => field.key === parameter);
    const [metricId, , ...metricDetails] = systems[key].metrics.find(([key]) => key === metricKey);
    const metricLabel = experimentMetricLabels[metricKey];
    const fieldLabel = field => experimentFieldLabels[field.key] ?? field.label;
    const [wrongEn, wrongHe] = distractors[key] ?? pipeDistractors;
    question.experiment = {
      change: { label: bilingual(fieldLabel(field)), unit: field.unit, values: [first, second] },
      goal: bilingual([`Compare the values shown in the two setups (${metricLabel[0]}).`, `השוו בין הערכים המוצגים בשני המצבים (${metricLabel[1]}).`]),
      metric: [metricId, metricLabel, ...metricDetails],
      runs: [first, second].map(value => ({
        values: { ...fixed, [parameter]: value },
        label: bilingual(systems[key].fields.filter(field => field.key === parameter || Object.hasOwn(fixed, field.key))
          .reduce(([en, he], field) => {
            const reading = `${field.key === parameter ? value : fixed[field.key]} ${field.unit}`.trim();
            const [labelEn, labelHe] = fieldLabel(field);
            return [[...en, `${labelEn} — ${reading}`], [...he, `${labelHe} — ${reading}`]];
          }, [[], []]).map(parts => parts.join(' · '))),
      })),
      reasoning: rotateQuizChoices(assess(
        ['Which explanation accounts for the comparison?', 'איזה הסבר מתאים לתוצאות ההשוואה?'],
        [reason[0], ...wrongEn], [reason[1], ...wrongHe], explanation), (index + 1) % 3),
    };
  }
  return question;
})]));

export const hydroCourse = {
  banks, entries,
  title: { en: 'Fluid mechanics achievements', he: 'הישגים במכניקת זורמים' },
  groups: [{ ids: entries.map(entry => entry.id), icon: 'trophy', label: { en: 'Fluid mechanics complete', he: 'השלמת מערכות הזורמים' } }],
};
