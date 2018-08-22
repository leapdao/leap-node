const { Tx } = require('parsec-lib');

const checkEpochLength = require('./checkEpochLength');

const getInitialState = () => ({
  epoch: {
    epoch: 0,
    epochLength: null,
    epochLengthIndex: -1,
  },
});

describe('checkEpochLength', () => {
  test('successful tx', () => {
    const state = getInitialState();
    const epochLength = Tx.epochLength(4);

    checkEpochLength(state, epochLength, {
      epochLengths: [4],
    });

    expect(state.epoch.epochLength).toBe(4);
  });

  test('tx without corresponding event', () => {
    const state = getInitialState();
    const epochLength = Tx.epochLength(4);

    expect(() => {
      checkEpochLength(state, epochLength, {
        epochLengths: [],
      });
    }).toThrow('Unknown epochLength change');
  });

  test('epoch length mismatch', () => {
    const state = getInitialState();
    const epochLength = Tx.epochLength(4);

    expect(() => {
      checkEpochLength(state, epochLength, {
        epochLengths: [5],
      });
    }).toThrow('Wrong epoch length');
  });
});
