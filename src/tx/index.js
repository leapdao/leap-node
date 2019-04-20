/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Tx } = require('leap-core');
const applyTx = require('./applyTx');
const accumulateTx = require('./accumulateTx');
const printTx = require('../txHelpers/printTx');

const { logTx, logError } = require('../utils/debug');

module.exports = (bridgeState, nodeConfig) => async (
  state,
  { encoded },
  _,
  isCheck
) => {
  const tx = Tx.fromRaw(encoded);
  const printedTx = printTx(state, tx);

  try {
    await applyTx(state, tx, bridgeState, nodeConfig);
    accumulateTx(state, tx);
  } catch (err) {
    logError(err.message);
    throw err;
  }

  if (printedTx) {
    logTx(`${isCheck ? 'Check: ' : ''}${printedTx}`);
  }
};
