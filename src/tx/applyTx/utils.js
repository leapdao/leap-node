/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Outpoint } = require('parsec-lib');
const isEqual = require('lodash/isEqual');

const isNFT = color => color > 2 ** 15;

const groupValuesByColor = (values, { color, value }) =>
  Object.assign({}, values, {
    [color]: isNFT(color)
      ? (values[color] || new Set()).add(value)
      : (values[color] || 0) + value,
  });

const checkInsAndOuts = (tx, state, unspentFilter) => {
  const inputTransactions = tx.inputs
    .map(input => state.unspent[input.prevout.hex()])
    .filter(unspentFilter);
  if (tx.inputs.length !== inputTransactions.length) {
    throw new Error('Wrong inputs');
  }

  const insValues = inputTransactions.reduce(groupValuesByColor, {});
  const outsValues = tx.outputs.reduce(groupValuesByColor, {});
  const colors = Object.keys(insValues);
  for (const color of colors) {
    if (!isEqual(insValues[color], outsValues[color])) {
      throw new Error('Ins and outs values are mismatch');
    }
  }
};

const removeInputs = (state, tx) => {
  tx.inputs.forEach(input => {
    const outpointId = input.prevout.hex();
    const { address, value, color } = state.unspent[outpointId];
    state.balances[color][address] -= value;
    delete state.unspent[outpointId];
  });
};

const addOutputs = (state, tx) => {
  tx.outputs.forEach((out, outPos) => {
    const outpoint = new Outpoint(tx.hash(), outPos);
    if (state.unspent[outpoint.hex()] !== undefined) {
      throw new Error('Attempt to create existing output');
    }
    state.balances[out.color] = state.balances[out.color] || {};
    state.balances[out.color][out.address] =
      state.balances[out.color][out.address] || 0;
    state.balances[out.color][out.address] += out.value;
    state.unspent[outpoint.hex()] = out.toJSON();
  });
};

const checkOutpoints = (state, tx) => {
  tx.inputs.forEach(input => {
    const outpointId = input.prevout.hex();
    if (!state.unspent[outpointId]) {
      throw new Error('Trying to spend non-existing output');
    }
  });
};

exports.checkInsAndOuts = checkInsAndOuts;
exports.removeInputs = removeInputs;
exports.addOutputs = addOutputs;
exports.checkOutpoints = checkOutpoints;
