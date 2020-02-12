/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { helpers, Tx, Outpoint } = require('leap-core');
const { filterUnspent } = require('../utils');

/*
 * Creates transfer tx based on address unspent outputs
 */
// ToDo: solve subset sum/knapsack problem for optimal outputs usage
module.exports = async function makeTransfer(
  { balances, unspent },
  from,
  to,
  amount,
  color,
  privKey
) {
  let fromAddr = from.toLowerCase(); // eslint-disable-line
  to = to.toLowerCase(); // eslint-disable-line
  const colorBalances = balances[color] || {};
  const balance = colorBalances[fromAddr] || 0;

  if (balance < amount) {
    throw new Error('Insufficient balance');
  }

  const senderUnspent = filterUnspent(unspent, from, color).map(u => ({
    output: u.output,
    outpoint: Outpoint.fromRaw(u.outpoint),
  }));

  const inputs = Tx.calcInputs(senderUnspent, from, amount, color);
  const outputs = Tx.calcOutputs(
    senderUnspent,
    inputs,
    fromAddr,
    to,
    amount,
    color
  );
  return privKey
    ? Tx.transfer(inputs, outputs).signAll(privKey)
    : Tx.transfer(inputs, outputs);
};
