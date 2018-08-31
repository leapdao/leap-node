/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type, Output } = require('parsec-lib');
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
  const color = Number(deposit.color);
  const isNFT = Output.isNFT(color);
  if (
    !deposit ||
    (isNFT
      ? deposit.amount !== tx.outputs[0].value
      : Number(deposit.amount) !== tx.outputs[0].value) ||
    color !== tx.outputs[0].color ||
    !addrCmp(deposit.depositor, tx.outputs[0].address)
  ) {
    throw new Error('Trying to submit incorrect deposit');
  }
  state.processedDeposit += 1;
};
