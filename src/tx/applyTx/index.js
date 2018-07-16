/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('parsec-lib');
const checkConsolidate = require('./checkConsolidate');
const checkDeposit = require('./checkDeposit');
const checkExit = require('./checkExit');
const checkTransfer = require('./checkTransfer');
const { checkOutpoints, removeInputs, addOutputs } = require('./utils');

const checks = {
  [Type.CONSOLIDATE]: checkConsolidate,
  [Type.DEPOSIT]: checkDeposit,
  [Type.EXIT]: checkExit,
  [Type.TRANSFER]: checkTransfer,
};

module.exports = async (state, tx, bridge) => {
  if (!checks[tx.type]) {
    throw new Error('Unsupported tx type');
  }

  checkOutpoints(state, tx);

  await checks[tx.type](state, tx, bridge);

  removeInputs(state, tx);
  addOutputs(state, tx);
};
