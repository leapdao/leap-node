const { BigInt, leftShift, add } = require('jsbi');
const buildCas = require('./buildCas');

const topmostBitSet = leftShift(BigInt(1), BigInt(255));

describe('buildCas', () => {
  test('basic test', () => {
    expect(buildCas([255])).toEqual(BigInt(1));
    expect(buildCas([254, 255])).toEqual(BigInt(3));
    expect(buildCas([0])).toEqual(topmostBitSet);
    expect(buildCas([0, 255])).toEqual(add(topmostBitSet, BigInt(1)));
  });

  test('ignores slots larger than 255', () => {
    expect(buildCas([255, 256])).toEqual(BigInt(1));
  });
});
