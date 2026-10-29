// Small authored MathML trees keep equations semantic without a runtime/CDN dependency.
export const row = (...children) => ['mrow', ...children];
export const fraction = (numerator, denominator) => ['mfrac', numerator, denominator];
export const identifier = name => ['mi', name];
export const subscript = (base, ...indices) => ['msub', base, row(...indices)];
export const power = (base, exponent) => ['msup', base, ['mn', String(exponent)]];
export const trig = (name, argument, exponent) => row(exponent === undefined ? ['mi', { mathvariant: 'normal' }, name] : power(['mi', { mathvariant: 'normal' }, name], exponent), ['mo', '⁡'], argument);
const subscripts = { '₁': '1', '₂': '2', 'ᵧ': 'y' };
const superscripts = { '²': '2' };
export function expression(text) {
  const parts = [];
  for (const token of text.match(/\d+(?:\.\d+)?|kg|[₁₂ᵧ²]|[^\s]/gu) || []) {
    if (subscripts[token] || superscripts[token]) {
      const base = parts.pop();
      parts.push([subscripts[token] ? 'msub' : 'msup', base, [token === 'ᵧ' ? 'mi' : 'mn', subscripts[token] || superscripts[token]]]);
    } else {
      const tag = /^\d/.test(token) ? 'mn' : token === 'kg' || token === 'N' ? 'mtext' : /^[A-Za-z]$/.test(token) ? 'mi' : 'mo';
      parts.push([tag, token]);
    }
  }
  return row(...parts);
}
export function renderMath({ text, label, expression: tree }) {
  const ns = 'http://www.w3.org/1998/Math/MathML';
  function build([tag, ...children]) {
    const node = document.createElementNS(ns, tag);
    for (const child of children) {
      if (typeof child === 'object' && !Array.isArray(child)) {
        for (const [key, value] of Object.entries(child)) node.setAttribute(key, value);
      } else if (Array.isArray(child)) node.append(build(child)); else node.textContent = child;
    }
    return node;
  }
  const math = document.createElementNS(ns, 'math');
  math.setAttribute('display', 'block'); math.setAttribute('dir', 'ltr');
  math.setAttribute('aria-label', label || text);
  math.append(build(tree || expression(text)));
  return math;
}
