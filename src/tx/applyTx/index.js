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
const checkValidatorJoin = require('./checkValidatorJoin');
const checkValidatorLogout = require('./checkValidatorLogout');
const checkVote = require('./checkVote');
const { checkOutpoints, removeInputs, addOutputs } = require('./utils');

const checks = {
  [Type.CONSOLIDATE]: checkConsolidate,
  [Type.DEPOSIT]: checkDeposit,
  [Type.EXIT]: checkExit,
  [Type.TRANSFER]: checkTransfer,
  [Type.VALIDATOR_JOIN]: checkValidatorJoin,
  [Type.VALIDATOR_LOGOUT]: checkValidatorLogout,
  [Type.PERIOD_VOTE]: checkVote,
};

module.exports = (state, tx, node) => {
  if (!checks[tx.type]) {
    throw new Error('Unsupported tx type');
  }

  checkOutpoints(state, tx);

  checks[tx.type](state, tx, node);

  removeInputs(state, tx);
  addOutputs(state, tx);
};
