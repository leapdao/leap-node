/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable global-require */

const { Type } = require('parsec-lib');
const { checkOutpoints, removeInputs, addOutputs } = require('./utils');

const checks = {
  [Type.CONSOLIDATE]: require('./checkConsolidate'),
  [Type.DEPOSIT]: require('./checkDeposit'),
  [Type.EPOCH_LENGTH]: require('./checkEpochLength'),
  [Type.EXIT]: require('./checkExit'),
  [Type.TRANSFER]: require('./checkTransfer'),
  [Type.VALIDATOR_JOIN]: require('./checkValidatorJoin'),
  [Type.VALIDATOR_LOGOUT]: require('./checkValidatorLogout'),
};

module.exports = (state, tx, bridgeState) => {
  if (!checks[tx.type]) {
    throw new Error('Unsupported tx type');
  }

  checkOutpoints(state, tx);

  checks[tx.type](state, tx, bridgeState);

  removeInputs(state, tx);
  addOutputs(state, tx);
};
