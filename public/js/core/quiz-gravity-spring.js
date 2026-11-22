const bilingual = ([en, he]) => ({ en, he });
const question = (topic, prompt, answers, explanations) => ({
  topic, prompt: bilingual(prompt), correct: 0, explanation: bilingual(explanations[0]),
  options: { en: answers.map(answer => answer[0]), he: answers.map(answer => answer[1]) },
  feedback: { en: explanations.map(answer => answer[0]), he: explanations.map(answer => answer[1]) },
});
const zero = ['Zero', 'אפס'];
const unchanged = ['It stays the same', 'הוא נשאר ללא שינוי'];
const doubles = ['It doubles', 'הוא גדל פי שניים'];
const halves = ['It halves', 'הוא קטן פי שניים'];
const larger = ['It increases', 'הוא גדל'];
const smaller = ['It decreases', 'הוא קטן'];
const springForce = ['The spring force', 'כוח הקפיץ'];

function questions(inclined) {
  const weight = inclined ? ['The downhill component of weight', 'רכיב כוח הכובד במורד המדרון'] : ['The weight of the mass', 'כוח הכובד הפועל על המסה'];
  const list = [
    question('forces', ['What does the spring force balance at equilibrium?', 'איזה כוח מאזן כוח הקפיץ בנקודת שיווי המשקל?'],
      [weight, ['The net force', 'הכוח השקול'], ['The normal force', 'כוח הנורמל']],
      [['The forces along the spring add to zero.', 'סכום הכוחות לאורך הקפיץ שווה לאפס.'], ['The net force is the sum of all forces.', 'הכוח השקול הוא סכום הכוחות.'], ['A normal force acts perpendicular to a surface.', 'כוח הנורמל פועל במאונך למשטח.']]),
    question('parameters', ['At fixed stiffness, how does doubling the mass change the equilibrium shift?', 'כיצד הכפלת המסה משנה את הסטת נקודת שיווי המשקל מאורך המנוחה של הקפיץ כשקבוע הקפיץ קבוע?'],
      [doubles, halves, unchanged],
      [['The weight along the spring doubles, so twice the extension is needed to balance it.', 'רכיב כוח הכובד לאורך הקפיץ גדל פי שניים, ולכן נדרשת התארכות כפולה לאיזונו.'], ['More weight requires more spring force.', 'כוח כובד גדול יותר דורש כוח קפיץ גדול יותר.'], ['The weight changes with mass.', 'כוח הכובד משתנה עם המסה.']]),
    question('motion', ['Where is speed greatest during a nonzero oscillation?', 'היכן גודל המהירות מרבי במהלך תנודה?'],
      [['At equilibrium', 'בנקודת שיווי המשקל'], ['At either turning point', 'באחת מנקודות המפנה'], ['At every point', 'בכל נקודה']],
      [['The mass gains speed as it approaches equilibrium and slows after passing it.', 'גודל המהירות גדל בהתקרבות לשיווי המשקל וקטן אחרי המעבר בו.'], ['The mass stops momentarily at each turning point.', 'הגוף נעצר לרגע בכל נקודת מפנה.'], ['The restoring force changes the velocity.', 'הכוח המחזיר משנה את המהירות.']]),
    question('forces', ['What is the net force when the mass crosses equilibrium?', 'מהו הכוח השקול כשהגוף עובר בנקודת שיווי המשקל?'],
      [zero, weight, springForce],
      [['The spring and gravity balance along the motion axis.', 'כוח הקפיץ ורכיב כוח הכובד לאורך ציר התנועה מאזנים זה את זה.'], ['The spring pulls opposite to the weight component there.', 'כוח הקפיץ פועל שם בכיוון הפוך לרכיב כוח הכובד.'], ['The weight component also contributes to the net force.', 'גם רכיב כוח הכובד תורם לכוח השקול.']]),
    question('parameters', ['At fixed mass, what happens to the equilibrium shift as stiffness increases?', 'כיצד משתנה הסטת נקודת שיווי המשקל מאורך המנוחה כשקבוע הקפיץ גדל והמסה קבועה?'],
      [smaller, larger, unchanged],
      [['A stiffer spring provides the same pull at a smaller extension.', 'קפיץ קשיח יותר מפעיל אותו כוח בהתארכות קטנה יותר.'], ['Compare the extensions needed for the same force.', 'השוו את ההתארכויות הדרושות לאותו כוח.'], ['The weight is fixed, but the force per unit extension changes.', 'כוח הכובד קבוע, אך כוח הקפיץ ליחידת התארכות משתנה.']]),
    question('motion', ['What happens if the mass is released from rest at equilibrium?', 'מה יקרה אם משחררים את הגוף ממנוחה בנקודת שיווי המשקל?'],
      [['It stays at rest', 'הגוף נשאר במנוחה'], ['It starts moving downhill along the spring', 'הגוף מתחיל לרדת לאורך הקפיץ'], ['It starts moving uphill along the spring', 'הגוף מתחיל לעלות לאורך הקפיץ']],
      [['It starts with both zero velocity and zero net force.', 'ברגע השחרור גם המהירות וגם הכוח השקול שווים לאפס.'], ['The spring already balances gravity along the axis.', 'כוח הקפיץ כבר מאזן את רכיב כוח הכובד לאורך הציר.'], ['The spring force is balanced at this point.', 'כוח הקפיץ מאוזן בנקודה זו.']]),
    question('forces', ['What is the spring force at the natural-length marker?', inclined ? 'מהו כוח הקפיץ בנקודת אורך המנוחה של הקפיץ?' : 'מהו כוח הקפיץ בנקודת אורך המנוחה הטבעי של הקפיץ?'],
      [zero, weight, ['The maximum force in every run', 'הכוח המרבי בכל הפעלה']],
      [['Hooke’s law gives zero spring force at zero extension.', 'לפי חוק הוק כוח הקפיץ שווה לאפס כשההתארכות אפס.'], ['The spring balances the weight component at the equilibrium marker.', 'כוח הקפיץ מאזן את רכיב הכובד בנקודת שיווי המשקל.'], ['Spring force grows in magnitude with stretch or compression.', 'גודל כוח הקפיץ גדל במתיחה או בכיווץ.']]),
    question('parameters', ['What happens to the period when the initial displacement magnitude doubles?', 'כיצד משתנה זמן המחזור כשמכפילים את גודל ההעתק ההתחלתי מנקודת שיווי המשקל?'],
      [unchanged, doubles, halves],
      [['The period of the ideal spring oscillator depends on mass and stiffness.', 'זמן המחזור של מתנד קפיץ אידאלי תלוי במסה ובקבוע הקפיץ.'], ['The larger excursion also gives a higher maximum speed.', 'בתנודה גדולה יותר גם גודל המהירות המרבי גדול יותר.'], ['The restoring acceleration and the excursion grow together.', 'התאוצה המחזירה וגודל התנודה גדלים יחד.']]),
    question('motion', ['At the lower turning point, which way does the acceleration point?', 'לאיזה כיוון מכוונת התאוצה בנקודת המפנה התחתונה?'],
      [['Toward equilibrium', 'לעבר נקודת שיווי המשקל'], ['Farther down the spring axis', inclined ? 'במורד המדרון' : 'כלפי מטה'], zero],
      [['The extra extension makes the spring force exceed the weight component.', 'ההתארכות הנוספת גורמת לכוח הקפיץ להיות גדול מרכיב כוח הכובד לאורך הציר.'], ['The motion reverses toward equilibrium.', 'התנועה מתהפכת לכיוון נקודת שיווי המשקל.'], ['Velocity vanishes at a turning point, while acceleration points inward.', 'בנקודת מפנה המהירות מתאפסת, והתאוצה מכוונת לעבר שיווי המשקל.']]),
    inclined
      ? question('parameters', ['What happens to the equilibrium shift as the incline is flattened to 0°?', 'כיצד משתנה הסטת נקודת שיווי המשקל מאורך המנוחה של הקפיץ כשמקטינים את זווית המדרון לאפס?'],
        [['It goes to zero', 'ההסטה מתאפסת'], unchanged, larger],
        [['At zero angle the downhill component of weight is zero.', 'בזווית אפס רכיב כוח הכובד במורד המדרון שווה לאפס.'], ['The component along the spring depends on the slope angle.', 'רכיב כוח הכובד לאורך הקפיץ תלוי בזווית המדרון.'], ['Flattening the slope reduces the component along the spring.', 'הקטנת השיפוע מקטינה את רכיב כוח הכובד לאורך הקפיץ.']])
      : question('parameters', ['How does the period compare with a horizontal oscillator of the same mass and stiffness?', 'מה הקשר בין זמני המחזור של מתנד אנכי ומתנד אופקי בעלי אותה מסה ואותו קבוע קפיץ?'],
        [['The periods are equal', 'זמני המחזור שווים'], ['The vertical period is longer', 'זמן המחזור של המתנד האנכי ארוך יותר'], ['The vertical period is shorter', 'זמן המחזור של המתנד האנכי קצר יותר']],
        [['Weight shifts the equilibrium while the restoring force per unit displacement remains the spring stiffness.', 'הכובד מסיט את נקודת שיווי המשקל, והכוח המחזיר ליחידת העתק עדיין נקבע לפי קבוע הקפיץ.'], ['Compare the acceleration at the same displacement from each equilibrium.', 'השוו את התאוצה באותו העתק מכל אחת מנקודות שיווי המשקל.'], ['Both systems have the same mass and restoring stiffness.', 'לשתי המערכות אותה מסה ואותו קבוע קפיץ.']]),
  ];
  function compare(key, first, second, unit) {
    return { useQuestionReasoning: true, runs: [first, second].map(value => ({
      values: { [key]: value }, label: { en: `${value} ${unit[0]}`, he: `${value} ${unit[1]}` },
    })) };
  }
  list[1].experiment = compare('mass', 5, 10, ['kg', 'ק״ג']);
  if (inclined) list[9].experiment = compare('angle', 35, 0, ['°', 'מעלות']);
  else list[4].experiment = compare('stiffness', 40, 80, ['N/m', 'ניוטון למטר']);
  return list;
}

export const gravitySpringQuestions = { 'vertical-spring': questions(false), 'incline-spring': questions(true) };
