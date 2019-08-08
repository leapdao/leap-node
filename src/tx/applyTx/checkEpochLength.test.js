const { Tx } = require('leap-core');

const checkEpochLength = require('./checkEpochLength');

const getInitialState = () => ({
  epoch: {
    epoch: 0,
    epochLength: null,
    epochLengthIndex: -1,
  },
});

describe('checkEpochLength', () => {
  test('wrong type', () => {
    const tx = Tx.transfer([], []);
    expect(() => checkEpochLength({}, tx)).toThrow('epochLength tx expected');
  });

  test('successful tx', () => {
    const state = getInitialState();
    const epochLength = Tx.epochLength(4);

    checkEpochLength(state, epochLength, {
      epochLengths: [4],
    });

    expect(state.epoch.epochLength).toBe(4);
  });

  test('series of txs', () => {
    const state = getInitialState();

    const epochLength1 = Tx.epochLength(4);
    checkEpochLength(state, epochLength1, {
      epochLengths: [4],
    });

    const epochLength2 = Tx.epochLength(3);
    checkEpochLength(state, epochLength2, {
      epochLengths: [4, 3],
    });

    expect(state.epoch.epochLength).toBe(3);
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
