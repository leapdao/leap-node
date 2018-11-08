/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Outpoint } = require('leap-core');
const isEqual = require('lodash/isEqual');

const { isNFT } = require('../../utils');

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
      throw new Error(`Ins and outs values are mismatch for color ${color}`);
    }
  }
};

const checkOutpoints = (state, tx) => {
  tx.inputs.forEach(input => {
    const outpointId = input.prevout.hex();
    if (!state.unspent[outpointId]) {
      throw new Error('Trying to spend non-existing output');
    }
  });
};

const addOutputs = ({ balances, owners, unspent }, tx) => {
  tx.outputs.forEach((out, outPos) => {
    const outpoint = new Outpoint(tx.hash(), outPos);
    if (unspent[outpoint.hex()] !== undefined) {
      throw new Error('Attempt to create existing output');
    }
    balances[out.color] = balances[out.color] || {};
    owners[out.color] = owners[out.color] || {};
    const cBalances = balances[out.color];
    const cOwners = owners[out.color];
    if (isNFT(out.color)) {
      cBalances[out.address] = cBalances[out.address] || [];
      cBalances[out.address].push(out.value);
      cOwners[out.value] = out.address;
    } else {
      cBalances[out.address] = cBalances[out.address] || 0;
      cBalances[out.address] += out.value;
    }

    unspent[outpoint.hex()] = out.toJSON();
  });
};

const removeInputs = ({ unspent, balances, owners }, tx) => {
  tx.inputs.forEach(input => {
    const outpointId = input.prevout.hex();
    const { address, value, color } = unspent[outpointId];

    if (isNFT(color)) {
      const index = balances[color][address].indexOf(value);
      balances[color][address].splice(index, 1);
      delete owners[color][value];
    } else {
      balances[color][address] -= value;
    }
    delete unspent[outpointId];
  });
};

exports.checkInsAndOuts = checkInsAndOuts;
exports.checkOutpoints = checkOutpoints;
exports.addOutputs = addOutputs;
exports.removeInputs = removeInputs;
