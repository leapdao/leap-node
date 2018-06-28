/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { helpers, Tx } = require('parsec-lib');
const { unspentForAddress } = require('../utils');

/*
 * Creates transfer tx based on address unspent outputs
 */
// ToDo: solve subset sum/knapsack problem for optimal outputs usage
module.exports = async function makeTransfer(
  { balances, unspent },
  from,
  to,
  amount,
  { height, privKey } = {}
) {
  let fromAddr = from.toLowerCase(); // eslint-disable-line
  to = to.toLowerCase(); // eslint-disable-line
  const balance = balances[fromAddr] || 0;

  if (balance < amount) {
    throw new Error('Insufficient balance');
  }

  const senderUnspent = unspentForAddress(unspent, from);
  const inputs = helpers.calcInputs(senderUnspent, amount);
  const outputs = helpers.calcOutputs(
    senderUnspent,
    inputs,
    fromAddr,
    to,
    amount
  );
  return Tx.transfer(height, inputs, outputs).signAll(privKey);
};
