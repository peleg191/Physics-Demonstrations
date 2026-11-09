import { row, renderMath } from './math.js';
import { element } from './dom.js';

// The authored mechanics notation used here, rendered locally as semantic MathML.
// No external renderer, fonts, or network requests are needed.
export function latexExpression(source) {
  let position = 0;
  const symbols = { alpha: 'α', theta: 'θ', mu: 'μ', omega: 'ω', pi: 'π', ell: 'ℓ', Sigma: 'Σ', sum: '∑', leq: '≤', geq: '≥',
    approx: '≈', cdot: '·', times: '×', pm: '±', mp: '∓', to: '→', circ: '°', infty: '∞', lvert: '|', rvert: '|', searrow: '↘', uparrow: '↑' };
  const space = () => { while (/\s/.test(source[position] || '') && position < source.length) position++; };
  function group() {
    space();
    if (source[position] === '{') { position++; const result = sequence('}'); position++; return result; }
    return atom();
  }
  function atom() {
    space();
    const char = source[position++];
    if (char === '{') { const result = sequence('}'); position++; return result; }
    if (char === '\\') {
      const command = source.slice(position).match(/^[A-Za-z]+/)?.[0] || source[position++];
      if (/^[A-Za-z]+$/.test(command)) position += command.length;
      if (command === 'frac') return ['mfrac', group(), group()];
      if (command === 'sqrt') return ['msqrt', group()];
      if (['sin', 'cos', 'tan'].includes(command)) return ['mi', { mathvariant: 'normal' }, command];
      if (['mathrm', 'text'].includes(command)) {
        space();
        if (source[position] !== '{') throw new Error(`Expected group after ${command}`);
        const start = ++position;
        while (position < source.length && source[position] !== '}') position++;
        const text = source.slice(start, position++);
        return [command === 'text' ? 'mtext' : 'mi', { mathvariant: 'normal' }, text];
      }
      if (['left', 'right'].includes(command)) return atom();
      if (['quad', 'qquad'].includes(command)) return ['mspace', { width: command === 'quad' ? '1em' : '2em' }];
      if ([',', ';', '!', ' '].includes(command)) return ['mspace', { width: command === '!' ? '0em' : '0.2em' }];
      if (!symbols[command]) throw new Error(`Unsupported authored LaTeX command: ${command}`);
      return [['alpha', 'theta', 'mu', 'omega', 'pi', 'ell'].includes(command) ? 'mi' : 'mo', symbols[command]];
    }
    if (/[0-9.]/.test(char)) {
      let value = char;
      while (/[0-9.]/.test(source[position] || '') && position < source.length) value += source[position++];
      return ['mn', value];
    }
    return [/[A-Za-zαθμ]/.test(char) ? 'mi' : 'mo', char === '-' ? '−' : char];
  }
  function sequence(end) {
    const children = [];
    while (position < source.length) {
      space(); if (position >= source.length || source[position] === end) break;
      let base = atom(), lower, upper;
      space();
      while (source[position] === '_' || source[position] === '^') {
        const operator = source[position++], value = group();
        if (operator === '_') lower = value; else upper = value;
        space();
      }
      if (lower && upper) base = ['msubsup', base, lower, upper];
      else if (lower) base = ['msub', base, lower];
      else if (upper) base = ['msup', base, upper];
      children.push(base);
    }
    if (end && source[position] !== end) throw new Error('Unclosed authored LaTeX group');
    return row(...children);
  }
  return sequence();
}
export const latexStep = source => ({ math: true, text: source, expression: latexExpression(source) });
export function renderLatex(source, display = 'inline') {
  const node = renderMath({ text: source, expression: latexExpression(source) });
  node.setAttribute('display', display); node.setAttribute('class', 'latex-math');
  return node;
}
export function mathText(tag, className, text) {
  const node = element(tag, className); let start = 0;
  for (const match of text.matchAll(/\$([^$]+)\$/g)) {
    if (match.index > start) node.append(element('span', '', text.slice(start, match.index)));
    node.append(renderLatex(match[1])); start = match.index + match[0].length;
  }
  if (start < text.length) node.append(element('span', '', text.slice(start)));
  return node;
}
