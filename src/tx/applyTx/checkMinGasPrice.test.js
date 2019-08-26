const { Tx } = require('leap-core');

const checkMinGasPrice = require('./checkMinGasPrice');

const getInitialState = () => ({
  gas: {
    minPrice: 0,
    minPriceIndex: -1,
  },
});

describe('checkMinGasPrice', () => {
  test('wrong type', () => {
    const tx = Tx.transfer([], []);
    expect(() => checkMinGasPrice({}, tx)).toThrow('minGasPrice tx expected');
  });

  test('successful tx', () => {
    const state = getInitialState();
    const minGasTx = Tx.minGasPrice('40000000000000');

    checkMinGasPrice(state, minGasTx, {
      minGasPrices: ['40000000000000'],
    });

    expect(state.gas.minPrice).toBe('40000000000000');
  });

  test('epoch length mismatch', () => {
    const state = getInitialState();
    const minGasTx = Tx.minGasPrice('40000000000000');

    expect(() => {
      checkMinGasPrice(state, minGasTx, {
        minGasPrices: ['55555555555555'],
      });
    }).toThrow('Wrong minGasPrice');
  });
});
