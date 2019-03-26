/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const NETWORKS = {
  1: {
    name: 'Mainnet',
    provider: 'https://mainnet.infura.io',
    etherscanBase: 'https://etherscan.io',
  },
  3: {
    name: 'Ropsten',
    provider: 'https://ropsten.infura.io',
    etherscanBase: 'https://ropsten.etherscan.io',
  },
  4: {
    name: 'Rinkeby',
    provider: 'https://rinkeby.infura.io',
    etherscanBase: 'https://rinkeby.etherscan.io',
  },
  42: {
    name: 'Kovan',
    provider: 'https://kovan.infura.io',
    etherscanBase: 'https://kovan.etherscan.io',
  },
  4447: {
    name: 'Truffle',
    provider: 'http://localhost:9545',
    etherscanBase: 'https://etherscan.io',
  },
  5777: {
    name: 'Ganache',
    provider: 'http://localhost:8545',
    etherscanBase: 'https://etherscan.io',
  },
};

module.exports = NETWORKS;
