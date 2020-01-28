const methods = require('./index');

describe('api/methods', () => {
  test('#net_version', async () => {
    const bridgeState = {
      networkId: 55881,
    };

    const { nodeApi } = methods(bridgeState);

    expect(await nodeApi.net_version()).toEqual(55881);
  });

  test('#plasma_getState', async () => {
    const bridgeState = {
      networkId: 55881,
      currentState: {
        epoch: {
          epochLength: 5,
        },
      },
      something: {
        nested: 'thing',
      },
    };

    const { nodeApi } = methods(bridgeState);

    const state = await nodeApi.plasma_getState();
    expect(state.networkId).toEqual(55881);
    expect(state.currentState.epoch.epochLength).toEqual(5);
    expect(state.something).toEqual(undefined);
  });
});
