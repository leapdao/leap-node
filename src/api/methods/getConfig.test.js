/* eslint-disable no-prototype-builtins */
const path = require('path');

const getConfig = require('./getConfig');

const NODE_ID = '51dcb849fd7870881750c1ef5503b61341ea3a1c';
const P2P_PORT = 41000;
const appMock = {
  info: () => ({
    p2pPort: P2P_PORT,
    genesisPath: path.join(__dirname, 'genesis.json'),
  }),
  status: async () => ({
    node_info: {
      id: NODE_ID,
    },
  }),
};

describe('getConfig', () => {
  test('basic config', async () => {
    const config = {
      exitHandlerAddr: '0x186fab4587006032993a9abc62ab288cc259d7e7',
      bridgeAddr: '0x186fab4587006032993a9abc62ab288cc259d7e7',
      operatorAddr: '0x186fab4587006032993a9abc62ab288cc259d7e7',
      rootNetwork: 'https://rinkeby.infura.io',
      network: 'testnet',
      networkId: '1341',
      eventsDelay: 6,
      bridgeDelay: 2,
    };
    const result = await getConfig({ config }, appMock);
    expect(result).toEqual({
      exitHandlerAddr: config.exitHandlerAddr,
      bridgeAddr: config.bridgeAddr,
      operatorAddr: config.operatorAddr,
      genesis: {},
      rootNetwork: config.rootNetwork,
      network: config.network,
      networkId: config.networkId,
      p2pPort: P2P_PORT,
      nodeId: NODE_ID,
      eventsDelay: 6,
      bridgeDelay: 2,
    });
  });

  test('with peers and genesis', async () => {
    const config = {
      exitHandlerAddr: '0x186fab4587006032993a9abc62ab288cc259d7e7',
      rootNetwork: 'https://rinkeby.infura.io',
      network: 'testnet',
      networkId: '1341',
      peers: ['peer1'],
      genesis: { validators: ['validator'] },
      eventsDelay: 0,
      bridgeDelay: 0,
    };
    const result = await getConfig({ config }, appMock);
    expect(result).toEqual({
      exitHandlerAddr: config.exitHandlerAddr,
      rootNetwork: config.rootNetwork,
      network: config.network,
      networkId: config.networkId,
      peers: config.peers,
      genesis: config.genesis,
      p2pPort: P2P_PORT,
      nodeId: NODE_ID,
      eventsDelay: 0,
      bridgeDelay: 0,
    });
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
    const result = await getConfig({ config }, appMock);
    expect(result.privKey).toBeUndefined();
    expect(result.someSensitiveStuff).toBeUndefined();
    expect(Object.keys(result)).toEqual([
      'exitHandlerAddr',
      'bridgeAddr',
      'operatorAddr',
      'rootNetwork',
      'network',
      'networkId',
      'eventsDelay',
      'bridgeDelay',
      'genesis',
      'peers',
      'p2pPort',
      'nodeId',
    ]);
  });
});
