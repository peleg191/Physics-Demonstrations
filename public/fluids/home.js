import { createCatalogCard } from '../js/core/catalog-card.js';
import { element } from '../js/core/dom.js';
import { quizProgressEvents } from '../js/core/quiz-progress.js';
import { hydroCourse } from './course.js';
import { systems } from './systems.js';
import { drawHydroHero } from './hero.js';

const covers = {
  pascal: {
    title: ['Pascal’s law', 'חוק פסקל'],
    description: ['See how a push on one piston can lift a load on the other.', 'בדקו כיצד כוח על בוכנה אחת יכול להרים גוף המונח על הבוכנה השנייה.'],
    topics: [['Hydrostatics', 'הידרוסטטיקה'], ['Pressure', 'לחץ'], ['Hydraulic lift', 'מערכת הידראולית']],
    subject: 'load',
  },
  buoyancy: {
    title: ['Archimedes’ principle', 'חוק ארכימדס'],
    description: ['Release a block and compare the fraction that floats underwater with the density ratio.', 'שחררו גוף והשוו בין החלק השקוע מנפחו לבין יחס הצפיפויות.'],
    topics: [['Hydrostatics', 'הידרוסטטיקה'], ['Buoyancy', 'כוח הציפה'], ['Density', 'צפיפות']],
    subject: 'block',
  },
  'narrowing-pipe': {
    title: ['Horizontal narrowing pipe', 'צינור אופקי שהולך ונעשה צר'],
    description: ['See how a smaller cross-section speeds up the water and lowers its static pressure.', 'בדקו כיצד הקטנת שטח החתך מגדילה את גודל מהירות הזרימה ומקטינה את הלחץ הסטטי.'],
    topics: [['Hydrodynamics', 'הידרודינמיקה'], ['Continuity', 'רציפות'], ['Bernoulli', 'ברנולי']],
  },
  'descending-pipe': {
    title: ['Widening downhill pipe', 'צינור מתרחב ויורד'],
    description: ['Separate the pressure gain from slowing the water from the gain due to a drop in elevation.', 'השוו בין תוספת הלחץ עקב האטת הזרימה לבין התוספת עקב הירידה בגובה.'],
    topics: [['Hydrodynamics', 'הידרודינמיקה'], ['Elevation', 'גובה'], ['Bernoulli', 'ברנולי']],
  },
  bernoulli: {
    title: ['Bernoulli’s equation', 'משוואת ברנולי'],
    description: ['Open a tank outlet and watch the water jet slow as the water level falls.', 'פתחו פתח במכל ובדקו כיצד הסילון מאט כשפני המים יורדים.'],
    topics: [['Hydrodynamics', 'הידרודינמיקה'], ['Continuity', 'רציפות'], ['Torricelli’s law', 'חוק טוריצ׳לי']],
  },
};

export function createHydroHome({ lang, translate, defaults, signal, achievements }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1120;
  canvas.height = 690;
  const images = new Map(hydroCourse.entries.map(({ key }) => {
    const image = element('img');
    image.alt = '';
    image.width = canvas.width;
    image.height = canvas.height;
    return [key, image];
  }));
  function refreshCovers() {
    for (const [key, image] of images) {
      const system = systems[key];
      const state = defaults(system);
      if (key === 'buoyancy') state.immersion = state.position = state.blockDensity / state.liquidDensity;
      system.draw(canvas, state, system.calculate(state), 0, covers[key].subject);
      image.src = canvas.toDataURL();
    }
    drawHydroHero(canvas);
    heroImage.src = canvas.toDataURL();
  }

  const hero = element('section', 'hero');
  const heroCopy = element('div', 'hero-copy');
  const heading = element('h1', '', translate(['Fluid mechanics', 'מכניקת זורמים']));
  heading.append(element('span', 'hero-accent', translate(['Fluids at rest and in motion', 'נוזלים במנוחה ובתנועה'])));
  heroCopy.append(heading, element('p', 'hero-intro', translate([
    'Explore how liquids transmit pressure, support floating objects, and flow through pipes or out of a tank.',
    'בדקו כיצד נוזלים מעבירים לחץ, מציפים גופים וזורמים בצינורות ומתוך מכל.',
  ])));
  const heroArt = element('div', 'hero-art hydro-hero-art');
  const heroImage = element('img');
  heroImage.alt = '';
  heroImage.width = canvas.width;
  heroImage.height = canvas.height;
  heroArt.append(heroImage);
  hero.append(heroCopy, heroArt);

  const collection = element('section', 'collection');
  const collectionHeading = element('div', 'collection-heading');
  const collectionTitle = element('h2', '', translate(['Explore the systems', 'בחרו מערכת']));
  collectionTitle.id = 'hydro-collection-title';
  collection.setAttribute('aria-labelledby', collectionTitle.id);
  collectionHeading.append(collectionTitle);
  const grid = element('div', 'catalog-grid');
  const cards = hydroCourse.entries.map(({ id, key, href }) => {
    const { title, description, topics } = covers[key];
    return createCatalogCard({
      id, href, image: images.get(key), title: translate(title), description: translate(description),
      topic: translate(topics[0]), tags: topics.slice(1).map(translate),
      lang, bank: hydroCourse.banks[id],
    });
  });
  quizProgressEvents.addEventListener('change', () => {
    for (const card of cards) card.updateAchievement();
  }, { signal });
  grid.append(...cards.map(({ card }) => card));
  collection.append(collectionHeading, grid);
  refreshCovers();
  return { sections: [hero, achievements, collection], refreshCovers };
}
