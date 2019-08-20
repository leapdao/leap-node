/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

module.exports = {
  1: {
    name: 'Mainnet',
    provider: {
      http: 'https://mainnet.infura.io/v3/f039330d8fb747e48a7ce98f51400d65',
      ws: 'wss://mainnet.infura.io/ws/v3/f039330d8fb747e48a7ce98f51400d65',
    },
    etherscanBase: 'https://etherscan.io',
  },
  3: {
    name: 'Ropsten',
    provider: {
      http: 'https://ropsten.infura.io/v3/f039330d8fb747e48a7ce98f51400d65',
      ws: 'wss://ropsten.infura.io/ws/v3/f039330d8fb747e48a7ce98f51400d65',
    },
    etherscanBase: 'https://ropsten.etherscan.io',
  },
  4: {
    name: 'Rinkeby',
    provider: {
      http: 'https://rinkeby.infura.io/v3/f039330d8fb747e48a7ce98f51400d65',
      ws: 'wss://rinkeby.infura.io/ws/v3/f039330d8fb747e48a7ce98f51400d65',
    },
    etherscanBase: 'https://rinkeby.etherscan.io',
  },
  5: {
    name: 'Görli',
    provider: {
      http: 'https://goerli.infura.io/v3/f039330d8fb747e48a7ce98f51400d65',
      ws: 'wss://goerli.infura.io/ws/v3/f039330d8fb747e48a7ce98f51400d65',
    },
    etherscanBase: 'https://goerli.etherscan.io',
  },
  42: {
    name: 'Kovan',
    provider: {
      http: 'https://kovan.infura.io/v3/f039330d8fb747e48a7ce98f51400d65',
      ws: 'wss://kovan.infura.io/ws/v3/f039330d8fb747e48a7ce98f51400d65',
    },
    etherscanBase: 'https://kovan.etherscan.io',
  },
  4447: {
    name: 'Truffle',
    provider: {
      http: 'http://localhost:9545',
      ws: 'ws://localhost:9545',
    },
    etherscanBase: 'https://etherscan.io',
  },
  5777: {
    name: 'Ganache',
    provider: {
      http: 'http://localhost:8545',
      ws: 'ws://localhost:8545',
    },
    etherscanBase: 'https://etherscan.io',
  },
};
