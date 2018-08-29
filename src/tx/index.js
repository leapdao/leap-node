/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Tx, Type } = require('parsec-lib');
const applyTx = require('./applyTx');
const accumulateTx = require('./accumulateTx');
const printTx = require('../txHelpers/printTx');
const runComputation = require('../computation/runComputation');

const { logTx, logError } = require('../debug');

const runTx = (state, tx, bridgeState, isCheck) => {
  const printedTx = printTx(state, tx);

  try {
    applyTx(state, tx, bridgeState);
    accumulateTx(state, tx);

    if (printedTx && !isCheck) {
      logTx(printedTx);
    }
  } catch (err) {
    logError(err.message);
    throw err;
  }
};

module.exports = bridgeState => async (state, { encoded }, _, isCheck) => {
  const tx = Tx.fromRaw(encoded);

  runTx(state, tx, bridgeState, isCheck);

  if (tx.type === Type.COMP_REQ) {
    const compResponse = await runComputation(state, tx);
    runTx(state, compResponse, bridgeState, isCheck);
  }
};
