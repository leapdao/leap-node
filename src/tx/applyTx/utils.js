/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Outpoint, Type } = require('leap-core');
const { isNFT, isNST } = require('../../utils');
const { uniq, isEqual } = require('lodash');

const groupValuesByColor = (values, { color, value }) => {
  if (!isNFT(color) && !isNST(color) && BigInt(value) < 1n) {
    throw new Error('One of the outs has value < 1');
  }
  return Object.assign({}, values, {
    [color]:
      isNFT(color) || isNST(color)
        ? (values[color] || new Set()).add(BigInt(value))
        : (values[color] || 0n) + BigInt(value),
  });
};

const checkInsAndOuts = (tx, state, bridgeState, unspentFilter) => {
  const inputTransactions = tx.inputs
    .map(input => state.unspent[input.prevout.hex()])
    .filter(unspentFilter);
  if (tx.inputs.length !== inputTransactions.length) {
    throw new Error('Wrong inputs');
  }

  const insValues = inputTransactions.reduce(groupValuesByColor, {});
  const outsValues = tx.outputs.reduce(groupValuesByColor, {});
  const colors = uniq([
    ...Object.keys(insValues),
    ...Object.keys(outsValues),
  ]).map(Number);
  const minGasPrice = BigInt(state.gas.minPrice);
  const gas = Math.max(0, tx.outputs.length * 20000 - tx.inputs.length * 10000);
  for (const color of colors) {
    const inputValue = insValues[color] || 0n;
    const outputValue = outsValues[color] || 0n;
    if (
      color === 0 &&
      gas > 0 &&
      minGasPrice > 0n &&
      tx.type === Type.TRANSFER
    ) {
      const txGasPrice = (inputValue - outputValue) / BigInt(gas);
      if (txGasPrice < minGasPrice) {
        throw new Error(`Tx underpriced`);
      }
    }
    const isNFTByColor = isNFT(color) || isNST(color);
    if (
      (isNFTByColor && !isEqual(inputValue, outputValue)) ||
      (!isNFTByColor && outputValue > inputValue)
    ) {
      throw new Error(`Ins and outs values are mismatch for color ${color}`);
    }
  }
};

const checkOutpoints = (state, tx) => {
  if (tx.type === Type.PERIOD_VOTE) return;
  tx.inputs.forEach(input => {
    const outpointId = input.prevout.hex();
    if (!state.unspent[outpointId]) {
      throw new Error('Trying to spend non-existing output');
    }
  });
};

const addOutputs = ({ balances, owners, unspent }, tx) => {
  if (tx.type === Type.PERIOD_VOTE) return;
  tx.outputs.forEach((out, outPos) => {
    const outpoint = new Outpoint(tx.hash(), outPos);
    if (unspent[outpoint.hex()] !== undefined) {
      throw new Error('Attempt to create existing output');
    }
    const cBalances = balances[out.color] || {};
    const cOwners = owners[out.color] || {};
    const tokenIsNFT = isNFT(out.color);
    const tokenIsNST = isNST(out.color);

    balances[out.color] = cBalances;
    owners[out.color] = cOwners;

    if (tokenIsNFT || tokenIsNST) {
      cBalances[out.address] = cBalances[out.address] || [];
      cBalances[out.address].push(out.value);
      cOwners[out.value] = out.address;
    } else {
      cBalances[out.address] = BigInt(cBalances[out.address] || 0);
      cBalances[out.address] = (cBalances[out.address] + out.value).toString();
    }
    unspent[outpoint.hex()] = out.toJSON();
  });
};

const removeInputs = ({ unspent, balances, owners }, tx) => {
  if (tx.type === Type.PERIOD_VOTE) return;
  tx.inputs.forEach(input => {
    const outpointId = input.prevout.hex();
    const { address, value, color } = unspent[outpointId];

    if (isNFT(color) || isNST(color)) {
      const index = balances[color][address].indexOf(value);
      balances[color][address].splice(index, 1);
      delete owners[color][BigInt(value).toString()];
    } else {
      balances[color][address] = (
        BigInt(balances[color][address]) - BigInt(value)
      ).toString();
    }
    delete unspent[outpointId];
  });
};

exports.checkInsAndOuts = checkInsAndOuts;
exports.checkOutpoints = checkOutpoints;
exports.groupValuesByColor = groupValuesByColor;
exports.addOutputs = addOutputs;
exports.removeInputs = removeInputs;
