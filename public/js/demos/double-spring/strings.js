import { strings as single } from '../spring/strings.js';
export const strings = {
 en: { ...single.en, stiffness: 'Spring constant (each)', caption: 'TWO IDENTICAL SPRINGS', title: 'Two-spring equations', force: 'F₁ + F₂ = −2kx',
 about: 'A point mass on a frictionless horizontal table between two identical ideal springs and opposite walls. Each spring has natural length l; the walls are 2l apart. Both springs are unstretched at the midpoint. Released from rest at x₀ = l − d, where d is the distance from the right wall. The drawing is schematic; no damping or collisions.',
 axis: 'x is measured rightward from the midpoint. Each spring exerts −kx, so the total force is −2kx. The arrow shows their sum. At release x(0) = A = l − d and v(0) = 0.',
 approximation: 'One spring stretches while the other compresses. Both exert a force toward the midpoint: F₁ = F₂ = −kx. Their sum is −2kx.',
 conclusion: 'The effective stiffness is 2k. The period is 1/√2 times the single-spring period for the same mass and individual spring constant.' },
 he: { ...single.he, stiffness: 'קבוע כל קפיץ', caption: 'שני קפיצים זהים', title: 'משוואות שני הקפיצים', force: 'F₁ + F₂ = −2kx',
 about: 'מסה נקודתית על שולחן ללא חיכוך בין שני קפיצים אידאליים זהים המחוברים לקירות נגדיים. אורך המנוחה של כל קפיץ הוא l והמרחק בין הקירות הוא 2l. במרכז שני הקפיצים רפויים. משחררים ממנוחה בהעתק x₀ = l − d, כאשר d הוא המרחק מהקיר הימני. השרטוט סכמטי; ללא ריסון או התנגשויות.',
 axis: 'ההעתק x נמדד מהמרכז וחיובי ימינה. כל קפיץ מפעיל כוח −kx, ולכן הכוח הכולל הוא −2kx. החץ מציג את הסכום. בשחרור x(0) = A = l − d והמהירות אפס.',
 approximation: 'קפיץ אחד נמתח והאחר מתכווץ. שניהם מפעילים כוח לעבר המרכז: F₁ = F₂ = −kx. סכום הכוחות הוא −2kx.',
 conclusion: 'קבוע הקפיץ האפקטיבי הוא 2k. זמן המחזור קטן פי √2 לעומת קפיץ יחיד עם אותה מסה ואותו קבוע קפיץ.' }
};
