/* eslint-disable no-underscore-dangle, global-require */

describe('readConfig', () => {
  jest.mock('fs');
  jest.mock('web3');
  jest.mock('leap-core');

  const fs = require('fs');
  fs.readFile = jest.fn((_, cb) => {
    cb(
      null,
      JSON.stringify({
        exitHandlerAddr: '0x000',
        network: 'testnet',
        rootNetwork: 'http://localhost',
        rootNetworkId: 5777,
      })
    );
  });

  const Web3 = require('web3');
  const readConfig = require('./readConfig');

  test('from file', async () => {
    Web3.__setMethodMock('eth.net.getId', () => 5777);

    const result = await readConfig('./config.json');
    expect(result).toEqual({
      exitHandlerAddr: '0x000',
      network: 'testnet',
      rootNetwork: 'http://localhost',
      rootNetworkId: 5777,
      eventsDelay: 0,
      bridgeDelay: 0,
    });
  });

  test('with rootNetwork from CLI', async () => {
    Web3.__setMethodMock('eth.net.getId', () => 5777);

    const result = await readConfig('./config.json', 'http://unfura.io/');
    expect(result).toEqual({
      exitHandlerAddr: '0x000',
      network: 'testnet',
      rootNetwork: 'http://unfura.io/',
      rootNetworkId: 5777,
      eventsDelay: 0,
      bridgeDelay: 0,
    });
  });

  test('fetch node config', async () => {
    Web3.__setMethodMock('getConfig', () => ({
      exitHandlerAddr: '0x000',
      network: 'testnet',
      rootNetwork: 'http://localhost',
      rootNetworkId: 5777,
    }));
    const result = await readConfig('https://tesnet.leapdao.org');
    expect(result).toEqual({
      exitHandlerAddr: '0x000',
      network: 'testnet',
      rootNetwork: 'http://localhost',
      rootNetworkId: 5777,
      eventsDelay: 0,
      bridgeDelay: 0,
    });
  });

  test('without bridge address', async () => {
    Web3.__setMethodMock('getConfig', () => ({
      network: 'testnet',
    }));
    let error;
    try {
      await readConfig('https://tesnet.leapdao.org');
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe('exitHandlerAddr is required');
  });

  test('should have rootNetwork either in CLI or in config', async () => {
    Web3.__setMethodMock('getConfig', () => ({
      exitHandlerAddr: '0x000',
      network: 'testnet',
      rootNetworkId: 5777,
    }));
    let error;
    try {
      await readConfig('https://tesnet.leapdao.org');
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe(
      'rootNetwork is not defined, please specify it in the config file.'
    );

    const result = await readConfig(
      'https://tesnet.leapdao.org',
      'http://localhost'
    );
    expect(result).toEqual({
      exitHandlerAddr: '0x000',
      network: 'testnet',
      rootNetwork: 'http://localhost',
      rootNetworkId: 5777,
      eventsDelay: 0,
      bridgeDelay: 0,
    });
  });

  test('rootNetworkId mismatch', async () => {
    Web3.__setMethodMock('eth.net.getId', () => 1);
    Web3.__setMethodMock('getConfig', () => ({
      exitHandlerAddr: '0x000',
      network: 'testnet',
      rootNetwork: 'http://localhost',
      rootNetworkId: 5777,
    }));
    let error;
    try {
      await readConfig('https://tesnet.leapdao.org');
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe('Chain Id mismatch, expected 5777, found 1.');
  });

  test("append donor's peer", async () => {
    Web3.__setMethodMock('eth.net.getId', () => 5777);
    Web3.__setMethodMock('getConfig', () => ({
      exitHandlerAddr: '0x000',
      network: 'testnet',
      rootNetwork: 'http://localhost',
      rootNetworkId: 5777,
      p2pPort: 41000,
      nodeId: 'blahblah',
    }));
    const result = await readConfig('https://tesnet.leapdao.org');
    expect(result).toEqual({
      exitHandlerAddr: '0x000',
      network: 'testnet',
      rootNetwork: 'http://localhost',
      rootNetworkId: 5777,
      peers: ['blahblah@tesnet.leapdao.org:41000'],
      eventsDelay: 0,
      bridgeDelay: 0,
    });
  });
});
