const Web3 = require('web3');
const getRootGasPrice = require('./getRootGasPrice');

describe('getRootGasPrice', () => {
  test('Reads gas price from gas station API for mainnet', async () => {
    const result = await getRootGasPrice(new Web3('https://mainnet.infura.io'));
    expect(result).toBeGreaterThan(0);
  });

  test('Returns null for non-mainnet networks', async () => {
    const result = await getRootGasPrice(new Web3('https://rinkeby.infura.io'));
    expect(result).toBeNull();
  });
});
