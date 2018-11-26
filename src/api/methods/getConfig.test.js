/* eslint-disable no-prototype-builtins */

const getConfig = require('./getConfig');

describe('getConfig', () => {
  test('basic config', async () => {
    const config = {
      bridgeAddr: '0x186fab4587006032993a9abc62ab288cc259d7e7',
      rootNetwork: 'https://rinkeby.infura.io',
      network: 'testnet',
      networkId: '1341',
    };
    const result = await getConfig({ config });
    expect(result.bridgeAddr).toBe(config.bridgeAddr);
    expect(result.rootNetwork).toBe(config.rootNetwork);
    expect(result.network).toBe(config.network);
    expect(result.networkId).toBe(config.networkId);
    expect(result.hasOwnProperty('peers')).toBe(false);
    expect(result.hasOwnProperty('genesis')).toBe(false);
  });

  test('with peers and genesis', async () => {
    const config = {
      bridgeAddr: '0x186fab4587006032993a9abc62ab288cc259d7e7',
      rootNetwork: 'https://rinkeby.infura.io',
      network: 'testnet',
      networkId: '1341',
      peers: ['peer1'],
      genesis: { validators: ['validator'] },
    };
    const result = await getConfig({ config });
    expect(result.bridgeAddr).toBe(config.bridgeAddr);
    expect(result.rootNetwork).toBe(config.rootNetwork);
    expect(result.network).toBe(config.network);
    expect(result.networkId).toBe(config.networkId);
    expect(result.peers).toBe(config.peers);
    expect(result.genesis).toBe(config.genesis);
  });

  test('only whitelisted fields', async () => {
    const config = {
      bridgeAddr: '0x186fab4587006032993a9abc62ab288cc259d7e7',
      rootNetwork: 'https://rinkeby.infura.io',
      network: 'testnet',
      networkId: '1341',
      peers: ['peer1'],
      genesis: { validators: ['validator'] },
      privKey: '0x000000',
      someSensitiveStuff: 'secret',
    };
    const result = await getConfig({ config });
    expect(result.privKey).toBeUndefined();
    expect(result.someSensitiveStuff).toBeUndefined();
    expect(Object.keys(result)).toEqual([
      'bridgeAddr',
      'rootNetwork',
      'network',
      'networkId',
      'genesis',
      'peers',
    ]);
  });
});
