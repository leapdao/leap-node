const heartbeat = require('.');
const defaults = require('./defaults');

const { NFT_COLOR_BASE } = require('../api/methods/constants');

const HEARTBEAT_COLOR = NFT_COLOR_BASE + 112;

jest.useFakeTimers();

describe('Heartbeat', () => {
  test('Does not start the service if config is missing', async () => {
    const bridgeStateMock = {
      config: {
        heartbeat: {},
      },
    };
    heartbeat(bridgeStateMock);
    expect(setTimeout).toHaveBeenCalledTimes(0);
  });

  test('Start the service respect defaults', async () => {
    const bridgeStateMock = {
      config: {
        heartbeat: { color: HEARTBEAT_COLOR },
      },
    };
    heartbeat(bridgeStateMock);
    expect(bridgeStateMock.config.heartbeat).toEqual({
      ...defaults,
      color: HEARTBEAT_COLOR,
    });
  });

  test('Start the service if config is correct', async () => {
    const bridgeStateMock = {
      config: {
        heartbeat: { color: HEARTBEAT_COLOR },
      },
    };
    heartbeat(bridgeStateMock);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(
      expect.any(Function),
      defaults.period
    );
  });
});
