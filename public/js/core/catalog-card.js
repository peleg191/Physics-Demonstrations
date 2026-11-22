import { element, svgElement } from './dom.js';
import { createAchievementSummary, decorateAchievementCard } from './quiz-achievements.js';

export function createCatalogCard({ id, href, image, title, description, number, topic, tags, lang, bank }) {
  const card = element('a', `experiment-card ${id}`);
  card.href = href;
  const imageArea = element('div', 'card-image');
  if (number) imageArea.append(element('span', 'card-number', number));
  imageArea.append(image);
  if (topic) imageArea.append(element('span', 'topic-pill', topic));

  const content = element('div', 'card-content');
  const titleRow = element('div', 'card-title-row');
  titleRow.append(element('h3', '', title));
  function updateAchievement() {
    decorateAchievementCard(card, id, bank);
    titleRow.querySelector('.card-achievements')?.remove();
    titleRow.append(createAchievementSummary(id, lang, bank));
  }
  updateAchievement();
  content.append(titleRow, element('p', '', description));
  const bottom = element('div', 'card-bottom');
  const tagList = element('div', 'tags');
  for (const tag of tags) tagList.append(element('span', '', tag));
  const arrow = element('span', 'card-arrow');
  arrow.setAttribute('aria-hidden', 'true');
  const icon = svgElement('svg', {
    viewBox: '0 0 24 24', width: 18, height: 18, focusable: 'false', fill: 'none',
    stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });
  svgElement('path', { d: 'M6 18 18 6M6 6h12v12' }, icon);
  arrow.append(icon);
  bottom.append(tagList, arrow);
  content.append(bottom);
  card.append(imageArea, content);
  return { card, updateAchievement };
}
