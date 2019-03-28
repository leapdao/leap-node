/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const axios = require('axios');
const encodeTx = require('../../lotion/lib/tx-encoding.js').encode;

module.exports = async (tendermintPort, rawTx) => {
  const nonce = Math.floor(Math.random() * (2 << 12)); // eslint-disable-line no-bitwise
  const txBytes = `0x${encodeTx({ encoded: rawTx }, nonce).toString('hex')}`;
  const tendermintRpcUrl = `http://localhost:${tendermintPort}/broadcast_tx_sync`;
  const result = await axios.get(tendermintRpcUrl, {
    params: {
      tx: txBytes,
    },
  });

  return {
    result: result.data.result,
  };
};
