/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable global-require */

const { Type } = require('leap-core');
const { checkOutpoints, removeInputs, addOutputs } = require('./utils');

const checks = {
  [Type.DEPOSIT]: require('./checkDeposit'),
  [Type.EPOCH_LENGTH]: require('./checkEpochLength'),
  [Type.MIN_GAS_PRICE]: require('./checkMinGasPrice'),
  [Type.EXIT]: require('./checkExit'),
  [Type.TRANSFER]: require('./checkTransfer'),
  [Type.VALIDATOR_JOIN]: require('./checkValidatorJoin'),
  [Type.VALIDATOR_LOGOUT]: require('./checkValidatorLogout'),
  [Type.SPEND_COND]: require('./checkSpendCond'),
  [Type.PERIOD_VOTE]: require('./checkPeriodVote'),
};

module.exports = async (state, tx, bridgeState, nodeConfig = {}) => {
  if (!checks[tx.type]) {
    throw new Error('Unsupported tx type');
  }

  checkOutpoints(state, tx);

  await checks[tx.type](state, tx, bridgeState, nodeConfig);

  removeInputs(state, tx);
  addOutputs(state, tx);
};
