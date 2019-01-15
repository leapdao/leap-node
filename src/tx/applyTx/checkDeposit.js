/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type, Output } = require('leap-core');
const { addrCmp } = require('../../utils');

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
  const deposit = bridgeState.deposits[tx.options.depositId];
  if (!deposit) {
    throw new Error('depositId not found in bridgeState');
  }
  if (
    (Output.isNFT(Number(deposit.color))
      ? deposit.amount !== tx.outputs[0].value
      : Number(deposit.amount) !== tx.outputs[0].value) ||
    Number(deposit.color) !== tx.outputs[0].color ||
    !addrCmp(deposit.depositor, tx.outputs[0].address)
  ) {
    throw new Error(
      `Trying to submit deposit with incorrect value ${deposit.amount}, ${
        deposit.color
      }, ${deposit.depositor}`
    );
  }
  state.processedDeposit += 1;
};
