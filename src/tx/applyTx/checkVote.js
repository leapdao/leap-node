/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('parsec-lib');

module.exports = (state, tx, node) => {
  if (tx.type !== Type.PERIOD_VOTE) {
    throw new Error('Period Vote tx expected');
  }

  // if merkle root out of date, move to previous, start new one
  // NOTE: node should only be passed when not syncing
  const txRoot = `0x${tx.inputs[0].prevout.hash.toString('hex')}`;
  if (
    node &&
    node.currentPeriod.merkleRoot() === txRoot &&
    state.latestPeriod.root !== txRoot
  ) {
    state.prevPeriod = state.latestPeriod;
    state.latestPeriod = {
      root: txRoot,
      sigs: [],
    };
  }
  // if no node provided, we are in sync, rotate without questions
  if (!node && state.latestPeriod.root !== txRoot) {
    state.prevPeriod = state.latestPeriod;
    state.latestPeriod = {
      root: txRoot,
      sigs: [],
    };
  }
  // if not initialized by rotation, we must be at voting for first period
  if (!state.latestPeriod.root) {
    state.latestPeriod = {
      root: txRoot,
      sigs: [],
    };
  }

  if (state.latestPeriod.root !== txRoot) {
    throw new Error(
      `Vote for wrong period: ${txRoot}, expected ${state.latestPeriod.root}`
    );
  }

  if (state.latestPeriod.sigs[tx.options.slotId]) {
    throw new Error(`Vote for slot ${tx.options.slotId} already cast`);
  }

  // ec-recover, check sig correct
  if (state.slots[tx.options.slotId].signerAddr !== tx.inputs[0].signer) {
    throw new Error(
      `invalid signer: ${tx.inputs[0].signer}, expected ${
        state.slots[tx.options.slotId].signerAddr
      }`
    );
  }

  // add to set
  state.latestPeriod.sigs[tx.options.slotId] = {
    v: tx.inputs[0].v,
    r: tx.inputs[0].r,
    s: tx.inputs[0].s,
  };
};
