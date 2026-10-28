export const strings = {
  en: {
    mass1: 'Left mass', mass2: 'Right mass', left: 'Left travel', right: 'Right travel',
    caption: 'FIXED PULLEY',
    about: 'A frictionless, massless fixed pulley and a taut, massless rope. Both masses start at rest. Travel ends before a mass reaches the pulley or ground; impacts are not simulated.',
    balanced: 'In balance. Equal masses stay at rest when released.',
    readyLeft: 'The left mass is heavier. Press Play to release the system.', readyRight: 'The right mass is heavier. Press Play to release the system.',
    leftDown: 'The left mass descends as the right mass rises.', rightDown: 'The right mass descends as the left mass rises.',
    end: 'Travel limit reached. Reset or change the masses to try again.',
    down: 'down', up: 'up', rest: 'at rest',
    description: (left, right, motion) => `Fixed pulley. Left mass ${left} kg, right mass ${right} kg. ${motion}`,
  },
  he: {
    mass1: 'המסה השמאלית', mass2: 'המסה הימנית', left: 'דרך המסה השמאלית', right: 'דרך המסה הימנית',
    caption: 'גלגלת קבועה',
    about: 'גלגלת קבועה חסרת מסה וללא חיכוך, וחבל מתוח חסר מסה. שתי המסות מתחילות ממנוחה. התנועה נעצרת לפני הגעה לגלגלת או לקרקע; אין הדמיית התנגשויות.',
    balanced: 'בשיווי משקל. מסות שוות נשארות במנוחה כשמשחררים אותן.',
    readyLeft: 'המסה השמאלית כבדה יותר. לחצו על הפעלה כדי לשחרר את המערכת.', readyRight: 'המסה הימנית כבדה יותר. לחצו על הפעלה כדי לשחרר את המערכת.',
    leftDown: 'המסה השמאלית יורדת והימנית עולה.', rightDown: 'המסה הימנית יורדת והשמאלית עולה.',
    end: 'המערכת הגיעה לגבול התנועה. אפשר לאפס או לשנות את המסות ולנסות שוב.',
    down: 'למטה', up: 'למעלה', rest: 'במנוחה',
    description: (left, right, motion) => `גלגלת קבועה. מסה שמאלית ${left} קילוגרם, מסה ימנית ${right} קילוגרם. ${motion}`,
  },
};
