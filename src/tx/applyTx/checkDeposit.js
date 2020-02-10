/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('leap-core');
const { BigInt, equal, lessThan } = require('jsbi-utils');
const { isNFT, isNST, addrCmp } = require('../../utils');

module.exports = (state, tx, bridgeState, nodeConfig, isCheck) => {
  if (tx.type !== Type.DEPOSIT) {
    throw new Error('Deposit tx expected');
  }

  const deposit = bridgeState.deposits[tx.options.depositId];

  if (!deposit) {
    throw new Error('Unexpected deposit: no Deposit event on the root chain');
  }

  if (deposit.included) {
    throw new Error('Deposit ID already used.');
  }

  const { color, value, address, data } = tx.outputs[0];

  if (!isNFT(color) && !isNST(color) && lessThan(BigInt(value), BigInt(1))) {
    throw new Error('Deposit out has value < 1');
  }

  if (
    !equal(BigInt(deposit.amount), BigInt(value)) ||
    Number(deposit.color) !== color ||
    !addrCmp(deposit.depositor, address) ||
    // NFTs do not have data :)
    (isNST(color) && deposit.data !== data)
  ) {
    throw new Error(
      `Incorrect deposit tx. DepositId: ${tx.options.depositId} ` +
        `Expected: ${deposit.color}:${deposit.amount}:${deposit.depositor}:${deposit.data} ` +
        `Actual: ${color}:${value}:${address}:${data}`
    );
  }
  if (!isCheck) {
    deposit.included = true;
  }
};
