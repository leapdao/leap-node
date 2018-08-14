/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Tx } = require('parsec-lib');
const applyTx = require('./applyTx');
const accumulateTx = require('./accumulateTx');
const printTx = require('../txHelpers/printTx');

const { logTx } = require('../debug');

module.exports = bridgeState => (state, { encoded }, _, isCheck) => {
  const tx = Tx.fromRaw(encoded);
  const printedTx = printTx(state, tx);

  applyTx(state, tx, bridgeState);
  accumulateTx(state, tx);

  if (printedTx && !isCheck) {
    logTx(printedTx);
  }
};
