const updateEpoch = require('./updateEpoch');

test('do not touch epoch', () => {
  const state = {
    epochLength: 4,
    lastEpochHeight: 0,
    epoch: 0,
  };

  updateEpoch(state, { height: 32 });
  expect(state.epoch).toBe(0);

  updateEpoch(state, { height: 64 });
  expect(state.epoch).toBe(0);
});

test('epoch update', () => {
  const state = {
    epochLength: 4,
    lastEpochHeight: 128,
    epoch: 1,
  };

  updateEpoch(state, { height: 260 });
  expect(state.epoch).toBe(2);
  expect(state.lastEpochHeight).toBe(256);
});

test('epoch update (chaned epochLength)', () => {
  const state = {
    epochLength: 5,
    lastEpochHeight: 128, // epochLength was 4
    epoch: 1,
  };

  updateEpoch(state, { height: 290 });
  expect(state.epoch).toBe(2);
  expect(state.lastEpochHeight).toBe(288);
});
