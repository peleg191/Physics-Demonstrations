export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
export function button(text, className = 'button') {
  const node = element('button', className, text);
  node.type = 'button';
  return node;
}
export function svgElement(tag, attributes = {}, parent) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  parent?.append(node);
  return node;
}
export function svgText(parent, x, y, text, attrs = {}) {
  const node = svgElement('text', { x, y, ...attrs }, parent);
  node.textContent = text;
  return node;
}

export function setText(node, text) {
  if (node.textContent !== text) node.textContent = text;
}
