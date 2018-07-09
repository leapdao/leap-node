/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type, Outpoint } = require('parsec-lib');
const { addrCmp } = require('../utils');

const groupValuesByColor = (values, { color, value }) =>
  Object.assign({}, values, {
    [color]: (values[color] || 0) + value,
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
    if (insValues[color] !== outsValues[color]) {
      throw new Error('Ins and outs values are mismatch');
    }
  }
};

const SUPPORTED_TYPES = [
  Type.CONSOLIDATE,
  Type.DEPOSIT,
  Type.EXIT,
  Type.TRANSFER,
  Type.COMP_REQ,
  Type.COMP_RESP,
];

const applyTx = async (state, tx, bridge) => {
  const result = [tx];
  if (SUPPORTED_TYPES.indexOf(tx.type) === -1) {
    throw new Error('Unsupported tx type');
  }

  tx.inputs.forEach(input => {
    const outpointId = input.prevout.hex();
    if (!state.unspent[outpointId]) {
      throw new Error('Trying to spend non-existing output');
    }
  });

  if (tx.type === Type.DEPOSIT) {
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
    const deposit = await bridge.methods.deposits(tx.options.depositId).call();
    if (
      Number(deposit.amount) !== tx.outputs[0].value ||
      Number(deposit.color) !== tx.outputs[0].color ||
      !addrCmp(deposit.owner, tx.outputs[0].address)
    ) {
      throw new Error('Trying to submit incorrect deposit');
    }
    state.processedDeposit += 1;
  }

  if (tx.type === Type.EXIT) {
    if (!tx.inputs.length === 1) {
      throw new Error('Exit tx should have one input');
    }

    const [{ prevout }] = tx.inputs;
    const unspent = state.unspent[prevout.hex()];
    const exit = await bridge.methods.exits(prevout.getUtxoId()).call();
    if (
      Number(exit.amount) !== unspent.value ||
      Number(exit.color) !== unspent.color
    ) {
      throw new Error('Trying to submit incorrect exit');
    }
  }

  if (tx.type === Type.CONSOLIDATE) {
    if (tx.inputs.length <= 1) {
      throw new Error('Consolidate tx should have > 1 input');
    }

    if (tx.outputs.length !== 1) {
      throw new Error('Consolidate tx should have only 1 output');
    }

    checkInsAndOuts(
      tx,
      state,
      ({ address }) => address === tx.outputs[0].address
    );
  }

  if (tx.type === Type.TRANSFER) {
    checkInsAndOuts(
      tx,
      state,
      ({ address }, i) => address === tx.inputs[i].signer
    );
  }

  if (tx.type === Type.COMP_REQ) {
    if (tx.inputs.length < 2) {
      throw new Error('Computation request should have 2+ inputs');
    }

    const inputs = tx.inputs.map(inp => state.unspent[inp.prevout.hex()]);
    if (inputs.length !== tx.inputs.length) {
      throw new Error('Wrong inputs');
    }

    if (!inputs[0].storageRoot) {
      throw new Error(
        'Unknown input. It should be deployment or computation response output'
      );
    }

    if (
      !tx.outputs[0].msgData &&
      tx.outputs.slice(1).some(output => output.msgData)
    ) {
      throw new Error(
        'Wrong outputs. First output should hold msgData, other input should be just transfers'
      );
    }

    if (inputs[0].address !== tx.outputs[0].address) {
      throw new Error('Input and output contract address mismatch');
    }
  }

  if (tx.type === Type.COMP_RESP) {
    if (tx.inputs.length !== 1) {
      throw new Error('Computation response should have only 1 input');
    }

    if (tx.outputs.length < 1) {
      throw new Error('Computation response should have 1+ outputs');
    }
  }

  // remove inputs
  tx.inputs.forEach(input => {
    const outpointId = input.prevout.hex();
    const { address, value, color } = state.unspent[outpointId];
    state.balances[color][address] -= value;
    delete state.unspent[outpointId];
  });

  // add outputs
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

    if (out.storageRoot) {
      state.storageRoots[out.address] = out.storageRoot;
    }
  });

  return result;
};

module.exports = applyTx;
