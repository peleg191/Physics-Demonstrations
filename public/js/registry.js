// Register another module here; the catalog and router need no system-specific edits.
export const demonstrations = [
  {
    id: 'basketball', number: '01', topic: 'mechanics', illustration: './assets/basketball.svg',
    title: { en: 'Basketball shot', he: 'זריקה לסל' },
    description: { en: 'One ball. So many possible arcs. Find your shot by playing with speed and angle.', he: 'כדור אחד, אינספור קשתות. משנים מהירות וזווית ומוצאים את הזריקה שלכם.' },
    tags: { en: ['Projectile motion', 'Kinematics'], he: ['תנועה בליסטית', 'קינמטיקה'] },
    load: () => import('./demos/basketball/index.js'),
  },
  {
    id: 'pulley', number: '02', topic: 'mechanics', illustration: './assets/pulley.svg',
    title: { en: 'The balancing act', he: 'משחק של איזון' },
    description: { en: 'Two masses, one connection. Explore the fine line between balance and motion.', he: 'שתי מסות, חיבור אחד. חוקרים את הגבול הדק שבין שיווי משקל לתנועה.' },
    tags: { en: ['Forces & motion', 'Equilibrium'], he: ['כוחות ותנועה', 'שיווי משקל'] },
    load: () => import('./demos/pulley/index.js'),
  },
  {
    id: 'incline', number: '03', topic: 'mechanics', illustration: './assets/incline.svg',
    title: { en: 'Inclined plane with friction', he: 'מישור משופע עם חיכוך' },
    description: { en: 'When does rest turn into sliding? Explore the critical angle and friction on a slope.', he: 'מתי המנוחה הופכת להחלקה? חוקרים את הזווית הקריטית ואת החיכוך במדרון.' },
    tags: { en: ['Friction', 'Newton’s laws'], he: ['חיכוך', 'חוקי ניוטון'] },
    load: () => import('./demos/incline/index.js'),
  },
  {
    id: 'pendulum', number: '04', topic: 'mechanics', illustration: './assets/pendulum.svg',
    title: { en: 'Small-angle pendulum', he: 'מטוטלת בזוויות קטנות' },
    description: { en: 'Explore harmonic motion. How do length, mass, and initial angle affect a pendulum?', he: 'חוקרים תנועה הרמונית. כיצד האורך, המסה והזווית ההתחלתית משפיעים על המטוטלת?' },
    tags: { en: ['Harmonic motion', 'Small angles'], he: ['תנועה הרמונית', 'זוויות קטנות'] },
    load: () => import('./demos/pendulum/index.js'),
  },
  {
    id: 'spring', number: '05', topic: 'mechanics', illustration: './assets/spring.svg',
    title: { en: 'Horizontal mass–spring oscillator', he: 'מתנד מסה–קפיץ אופקי' },
    description: { en: 'Stretch, release, repeat. Explore the restoring force and period of a mass on a spring.', he: 'מותחים, משחררים ומתנודדים. חוקרים את הכוח המחזיר ואת זמן המחזור של מסה על קפיץ.' },
    tags: { en: ['Hooke’s law', 'Harmonic motion'], he: ['חוק הוק', 'תנועה הרמונית'] },
    load: () => import('./demos/spring/index.js'),
  },
];
