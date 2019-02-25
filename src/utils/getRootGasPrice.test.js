const getRootGasPrice = require('./getRootGasPrice');

describe('getRootGasPrice', () => {
  test('Reads gas price from gas station API', async () => {
    const result = await getRootGasPrice();
    expect(result).toBeGreaterThan(0);
  });
});
