/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const axios = require('axios');

const GAS_STATION_API = 'https://ethgasstation.info/json/ethgasAPI.json';

/**
 * Reads proposed gas price from the ethgasstation API for mainnet. For other
 * networks returns `null`.
 *
 * Default price urgency is "fast" (block in < 2 min).
 * Other options are: safeLow, average, fastest
 */
module.exports = async function getRootGasPrice(web3, urgency = 'fast') {
  const networkId = await web3.eth.net.getId();
  if (networkId !== 1) return null;
  return axios.get(GAS_STATION_API).then(response => {
    return (response.data[urgency] / 10) * 10 ** 9;
  });
};
