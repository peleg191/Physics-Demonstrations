import test from 'node:test';
import assert from 'node:assert/strict';
import { expression } from '../public/js/core/math.js';

test('friction coefficients attach letter subscripts to Greek identifiers', () => {
  assert.deepEqual(expression('μₛg'), ['mrow',
    ['msub', ['mi', 'μ'], ['mi', 's']], ['mi', 'g']]);
  assert.deepEqual(expression('fₖ = μₖN'), ['mrow',
    ['msub', ['mi', 'f'], ['mi', 'k']], ['mo', '='],
    ['msub', ['mi', 'μ'], ['mi', 'k']], ['mtext', 'N']]);
});

test('numeric subscripts and powers keep their existing structure', () => {
  assert.deepEqual(expression('m₁v²'), ['mrow',
    ['msub', ['mi', 'm'], ['mn', '1']],
    ['msup', ['mi', 'v'], ['mn', '2']]]);
});
