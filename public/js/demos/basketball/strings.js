export const strings = {
  en: {
    speed: 'Launch speed', angle: 'Launch angle', releaseHeight: 'Release height', hoopHeight: 'Hoop height', distance: 'Distance to hoop',
    x: 'Horizontal distance', y: 'Height', compare: 'Keep the previous trajectory',
    about: 'A point-like ball in uniform gravity, without air resistance or bounces. A basket means passing within 12 cm of hoop height while moving downward. Ball and hoop sizes are illustrative.',
    ready: 'Find your arc. Change the speed or angle, then press Play.', moving: 'Watch the arc unfold…',
    score: 'Basket! The ball reaches the hoop on the way down.', rising: 'At hoop height, but still rising. Try a different arc.',
    high: 'Above the hoop. Try changing the speed or angle.', low: 'Below the hoop. Try changing the speed or angle.',
    short: 'The ball lands before reaching the hoop.', caption: 'PROJECTILE MOTION',
    description: (x, y) => `Basketball: horizontal distance ${x} m, height ${y} m.`,
  },
  he: {
    speed: 'מהירות הזריקה', angle: 'זווית הזריקה', releaseHeight: 'גובה השחרור', hoopHeight: 'גובה הסל', distance: 'המרחק לסל',
    x: 'מרחק אופקי', y: 'גובה', compare: 'שמירת המסלול הקודם',
    about: 'כדור נקודתי בשדה כבידה אחיד, ללא התנגדות אוויר או קפיצות. קליעה היא מעבר בטווח של 12 ס״מ מגובה הסל בזמן ירידה. גודלי הכדור והסל להמחשה בלבד.',
    ready: 'מוצאים את הקשת שלכם. משנים מהירות או זווית, ולוחצים על הפעלה.', moving: 'עוקבים אחרי המסלול…',
    score: 'סל! הכדור מגיע לסל בזמן הירידה.', rising: 'בגובה הסל, אבל עדיין בעלייה. נסו קשת אחרת.',
    high: 'מעל הסל. נסו לשנות את המהירות או הזווית.', low: 'מתחת לסל. נסו לשנות את המהירות או הזווית.',
    short: 'הכדור נוחת לפני שהוא מגיע לסל.', caption: 'תנועה בליסטית',
    description: (x, y) => `כדורסל: מרחק אופקי ${x} מטר, גובה ${y} מטר.`,
  },
};
