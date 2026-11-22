import { strings as spring } from '../spring/strings.js';

export function gravitySpringStrings(inclined) {
  return {
    en: {
      ...spring.en,
      caption: inclined ? 'SPRING OSCILLATOR ON AN INCLINE' : 'VERTICAL SPRING OSCILLATOR',
      angle: 'Incline angle',
      position: 'Displacement from equilibrium', naturalLength: 'Natural length', equilibrium: 'Equilibrium', shift: 'Equilibrium shift',
      hint: 'Drag the mass to set its starting displacement. Select it to show the net force and derive the equilibrium position.',
      about: inclined
        ? 'An ideal spring lies along a frictionless slope. The downhill component of weight shifts equilibrium by ΔL = mg sin θ / k. The normal force balances the perpendicular component. At 0° the two markers coincide.'
        : 'An ideal spring hangs from a fixed support. Weight stretches the spring until its upward pull balances mg. The equilibrium position is ΔL = mg/k below the natural-length position.',
      axis: `The extension q is measured from the natural-length position, positive ${inclined ? 'down the slope' : 'downward'}. The displacement x is measured from the shifted equilibrium. The arrow shows the net force along the spring.`,
      approximation: 'At equilibrium, the spring force balances the component of weight along the spring. Measure displacement from that point to simplify the motion equation.',
      moving: 'The mass oscillates around the solid equilibrium marker. Set the initial displacement to zero to leave it at rest there.',
      force: 'Fₙₑₜ = −kx',
    },
    he: {
      ...spring.he,
      caption: inclined ? 'מתנד מסה–קפיץ במדרון' : 'מתנד מסה–קפיץ אנכי',
      angle: 'זווית המדרון',
      position: 'העתק משיווי משקל', naturalLength: 'אורך מנוחה', equilibrium: 'שיווי משקל', shift: 'הסטת שיווי המשקל',
      hint: 'גררו את הגוף כדי לקבוע את ההעתק ההתחלתי. בחרו בו כדי להציג את הכוח השקול ואת חישוב נקודת שיווי המשקל.',
      about: inclined
        ? 'קפיץ אידאלי מונח לאורך מדרון חלק. רכיב כוח הכובד במורד המדרון מסיט את נקודת שיווי המשקל. כוח הנורמל מאזן את הרכיב המאונך למדרון. בזווית אפס שני הסימונים מציינים אותה נקודה.'
        : 'קפיץ אידאלי תלוי מתומך קבוע. כוח הכובד מותח את הקפיץ עד שכוח הקפיץ כלפי מעלה מאזן אותו. נקודת שיווי המשקל נמצאת מתחת לנקודה שבה הקפיץ באורך המנוחה שלו.',
      axis: inclined ? 'את ההתארכות q מודדים מנקודת אורך המנוחה של הקפיץ, בכיוון מורד המדרון. את ההעתק x מודדים מנקודת שיווי המשקל. החץ מראה את הכוח השקול לאורך הקפיץ.'
        : 'את ההתארכות q מודדים מנקודת אורך המנוחה של הקפיץ, כלפי מטה. את ההעתק x מודדים מנקודת שיווי המשקל. החץ מראה את הכוח השקול לאורך הקפיץ.',
      approximation: 'בשיווי משקל, כוח הקפיץ מאזן את רכיב כוח הכובד לאורך הקפיץ. מדידת ההעתק מנקודה זו מפשטת את משוואת התנועה.',
      moving: 'הגוף מתנודד סביב נקודת שיווי המשקל המסומנת בקו רציף. קבעו העתק התחלתי אפס כדי להשאיר את הגוף במנוחה בנקודה זו.',
      force: 'Fₙₑₜ = −kx',
    },
  };
}
