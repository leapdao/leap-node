/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('leap-core');
const { BigInt, equal, lessThan } = require('jsbi-utils');
const { isNFT, addrCmp } = require('../../utils');

module.exports = (state, tx, bridgeState) => {
  if (tx.type !== Type.DEPOSIT) {
    throw new Error('Deposit tx expected');
  }

  if (tx.options.depositId <= state.processedDeposit) {
    throw new Error('Deposit ID already used.');
  }
  if (tx.options.depositId > state.processedDeposit + 1) {
    throw new Error(
      `Deposit ID skipping ahead. want ${state.processedDeposit + 1}, found ${
        tx.options.depositId
      }`
    );
  }

  if (
    !isNFT(tx.outputs[0].color) &&
    lessThan(BigInt(tx.outputs[0].value), BigInt(1))
  ) {
    throw new Error('Deposit out has value < 1');
  }
  const deposit = bridgeState.deposits[tx.options.depositId];
  if (
    !deposit ||
    !equal(BigInt(deposit.amount), BigInt(tx.outputs[0].value)) ||
    Number(deposit.color) !== tx.outputs[0].color ||
    !addrCmp(deposit.depositor, tx.outputs[0].address)
  ) {
    throw new Error('Trying to submit incorrect deposit');
  }
  state.processedDeposit += 1;
};
