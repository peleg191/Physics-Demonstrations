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
];
