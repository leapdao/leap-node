/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const axios = require('axios');

const GAS_STATION_API = 'https://ethgasstation.info/json/ethgasAPI.json';

const MAX_GAS_PRICE = 200 * 10 ** 9; // 200 gwei

/**
 * Reads proposed gas price from the ethgasstation API for mainnet. For other
 * networks returns `null`.
 *
 * Default price urgency is "fast" (block in < 2 min).
 * Other options are: safeLow, average, fastest
 *
 * Maximum gas price is capped to 200 gwei.
 */
module.exports = async function getRootGasPrice(web3, urgency = 'fast') {
  const networkId = await web3.eth.net.getId();
  if (networkId !== 1) return null;
  return axios
    .get(GAS_STATION_API)
    .then(response => {
      return Math.min(MAX_GAS_PRICE, (response.data[urgency] * 10 ** 9) / 10);
    })
    .catch(e => {
      throw new Error('Gas Station error', e);
    });
};
