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
      epochLength: 5,
      something: {
        nested: 'thing',
      },
    };

    const { nodeApi } = methods(bridgeState);

    expect(await nodeApi.plasma_getState()).toEqual(bridgeState);
  });
});
