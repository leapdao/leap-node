const defaults = require('./defaults');
const loop = require('./loop');
const pulse = require('./pulse');

const { NFT_COLOR_BASE } = require('../api/methods/constants');

const HEARTBEAT_COLOR = NFT_COLOR_BASE + 112;

const bridgeStateMock = {
  config: {
    heartbeat: { ...defaults, color: HEARTBEAT_COLOR },
  },
};

jest.useFakeTimers();
jest.mock('./pulse');

describe('Loop', () => {
  test('Waits the correct period if no error happened', async () => {
    pulse.mockImplementation(async () => null);
    await loop(bridgeStateMock);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(
      expect.any(Function),
      defaults.period
    );
  });

  test('Waits the correct period if error in send happened', async () => {
    pulse.mockImplementation(async () => {
      throw new Error('Oopsy poopsy');
    });
    await loop(bridgeStateMock);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(
      expect.any(Function),
      defaults.periodOnError
    );
  });
});
