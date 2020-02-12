const buildCas = require('./buildCas');

const topmostBitSet = 1n << 255n;

describe('buildCas', () => {
  test('basic test', () => {
    expect(buildCas([255])).toEqual(1n);
    expect(buildCas([254, 255])).toEqual(3n);
    expect(buildCas([0])).toEqual(topmostBitSet);
    expect(buildCas([0, 255])).toEqual(topmostBitSet + 1n);
  });

  test('ignores slots larger than 255', () => {
    expect(buildCas([255, 256])).toEqual(1n);
  });
});
