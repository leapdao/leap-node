/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const sendTx = require('./sendTx');

const MIN_DELAY = 2000;

module.exports = tendermintPort => ({
  send: tx => sendTx(tendermintPort, tx.hex()),
  sendDelayed: tx =>
    setTimeout(() => {
      sendTx(tendermintPort, tx.hex());
    }, MIN_DELAY),
});
