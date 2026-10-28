const messages = {
  en: {
    brand: 'physics playground', collection: 'The collection', skip: 'Skip to content', nav: 'Main navigation',
    footer: 'A little curiosity. A lot of possibility.', footerNote: 'Explore · Observe · Try again',
    eyebrow: 'AN OPEN LAB FOR CURIOUS MINDS', hero: 'Get a feel for', heroAccent: 'how things move.',
    intro: 'A collection of small experiments with big ideas. Change something, see what happens, and let your intuition catch up.',
    count: 'experiments to explore', collectionTitle: 'Pick a system. Start exploring.', collectionNote: 'No instructions to follow. Just possibilities to try.',
    open: 'Open experiment', mechanics: 'Mechanics', lab: 'THE COLLECTION',
    back: 'All experiments', experiment: 'INTERACTIVE EXPERIMENT', parameters: 'Make it your own', parametersNote: 'Change a value. See a different story.',
    play: 'Play', pause: 'Pause', replay: 'Play again', reset: 'Reset', step: 'Step', speed: 'Playback', normal: 'Normal', slow: 'Slow',
    defaults: 'Restore defaults', advanced: 'More to explore', time: 'Time', ready: 'Ready when you are', paused: 'Paused', running: 'In motion', finished: 'Experiment complete',
    assumptions: 'About this model', stage: 'Interactive system diagram', reduced: 'Reduced motion is on. Use Play to animate, or Step to explore at your pace.',
    notFound: 'This experiment is not in the collection.', return: 'Back to the collection', loading: 'Opening experiment…', failed: 'The experiment could not load. Please refresh and try again.',
    defaultNote: 'Parameter changes restart the experiment.', meters: 'm', seconds: 's', kilograms: 'kg', ms: 'm/s',
  },
  he: {
    brand: 'מגרש משחקים לפיזיקה', collection: 'אוסף הניסויים', skip: 'דילוג לתוכן', nav: 'ניווט ראשי',
    footer: 'קצת סקרנות. הרבה אפשרויות.', footerNote: 'לחקור · להתבונן · לנסות שוב',
    eyebrow: 'מעבדה פתוחה לסקרנות', hero: 'להרגיש איך', heroAccent: 'דברים זזים.',
    intro: 'אוסף של ניסויים קטנים עם רעיונות גדולים. משנים משהו, רואים מה קורה, ומפתחים אינטואיציה.',
    count: 'ניסויים שאפשר לחקור', collectionTitle: 'בוחרים מערכת. מתחילים לחקור.', collectionNote: 'בלי מסלול קבוע. פשוט לנסות ולגלות.',
    open: 'פתיחת הניסוי', mechanics: 'מכניקה', lab: 'אוסף הניסויים',
    back: 'כל הניסויים', experiment: 'ניסוי אינטראקטיבי', parameters: 'עכשיו תורכם לשנות', parametersNote: 'משנים ערך. רואים סיפור אחר.',
    play: 'הפעלה', pause: 'השהיה', replay: 'הפעלה מחדש', reset: 'איפוס', step: 'צעד', speed: 'קצב הניגון', normal: 'רגיל', slow: 'איטי',
    defaults: 'שחזור ערכי ברירת מחדל', advanced: 'עוד אפשרויות', time: 'זמן', ready: 'אפשר להתחיל', paused: 'מושהה', running: 'בתנועה', finished: 'הניסוי הסתיים',
    assumptions: 'על המודל', stage: 'תרשים אינטראקטיבי של המערכת', reduced: 'העדפת תנועה מופחתת פעילה. אפשר להפעיל את האנימציה או להתקדם בצעדים.',
    notFound: 'הניסוי הזה לא נמצא באוסף.', return: 'חזרה לאוסף', loading: 'פותחים את הניסוי…', failed: 'לא ניתן לטעון את הניסוי. יש לרענן את הדף ולנסות שוב.',
    defaultNote: 'שינוי פרמטר מתחיל את הניסוי מחדש.', meters: 'm', seconds: 's', kilograms: 'kg', ms: 'm/s',
  },
};
export const languages = ['en', 'he'];
export function translator(lang) { return key => messages[lang][key] ?? key; }
export const format = (value, digits = 2) => Number(value).toFixed(digits);
