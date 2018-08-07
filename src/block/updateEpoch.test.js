const updateEpoch = require('./updateEpoch');

test('do not touch epoch', () => {
  const state = {
    epoch: {
      epochLength: 4,
      lastEpochHeight: 0,
      epoch: 0,
    },
  };

  updateEpoch(state, { height: 32 });
  expect(state.epoch.epoch).toBe(0);

  updateEpoch(state, { height: 64 });
  expect(state.epoch.epoch).toBe(0);
});

test('epoch update', () => {
  const state = {
    epoch: {
      epochLength: 4,
      lastEpochHeight: 128,
      epoch: 1,
    },
  };

  updateEpoch(state, { height: 260 });
  expect(state.epoch.epoch).toBe(2);
  expect(state.epoch.lastEpochHeight).toBe(256);
});

test('epoch update (changed epochLength)', () => {
  const state = {
    epoch: {
      epochLength: 5,
      lastEpochHeight: 128, // epochLength was 4
      epoch: 1,
    },
  };

  updateEpoch(state, { height: 290 });
  expect(state.epoch.epoch).toBe(2);
  expect(state.epoch.lastEpochHeight).toBe(288);
});

test('epoch update (empty epochLength)', () => {
  const state = {
    epoch: {
      epochLength: 0,
      lastEpochHeight: 0,
      epoch: 0,
    },
  };

  updateEpoch(state, { height: 20 });
  expect(state.epoch.epoch).toBe(0);
});
