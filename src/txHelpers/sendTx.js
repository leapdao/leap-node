/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const axios = require('axios');

const TX_BACKLOG = [];

// Drain the tx queue every 1000ms.
// The goal here is to increase performance and mitigate block congestion.
// Bursting calls to `broadcast_tx_async` archieves that.
setInterval(
  () => {
    while (TX_BACKLOG.length) {
      const func = TX_BACKLOG.shift();

      func();
    }
  },
  1000
);

module.exports = async (tendermintPort, rawTx) => {
  const tendermintRpcUrl = `http://localhost:${tendermintPort}/broadcast_tx_async`;

  TX_BACKLOG.push(
    () => {
      axios.get(tendermintRpcUrl, {
        params: {
          tx: rawTx,
        },
      })
    }
  );
};
