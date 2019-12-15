/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('leap-core');
const { bufferToHex } = require('ethereumjs-util');

module.exports = async (state, tx, bridgeState) => {
  if (tx.type !== Type.PERIOD_VOTE) {
    throw new Error('[period vote] periodVote tx expected');
  }

  const { slotId } = tx.options;

  if (!state.slots[slotId]) {
    throw new Error(`[period vote] Slot ${slotId} is empty`);
  }

  if (
    !tx.inputs ||
    !tx.inputs[0].signer ||
    tx.inputs[0].signer !== state.slots[slotId].signerAddr
  ) {
    throw new Error(
      `[period vote] Input should be signed by validator: ${state.slots[slotId].signerAddr}`
    );
  }

  if (tx.inputs[0].prevout.index !== 0) {
    throw new Error(
      `[period vote] Input should have prevout index of 0. Got: ${tx.inputs[0].prevout.index}`
    );
  }

  const blocksRoot = bufferToHex(tx.inputs[0].prevout.hash);

  if (!bridgeState.periodProposal || bridgeState.periodProposal.blocksRoot !== blocksRoot) {
    throw new Error(
      `[period vote] Vote for different period. Proposed root: ${(bridgeState.periodProposal || {}).blocksRoot}.` +
      ` Voted root: ${blocksRoot}`
    );
  }

  const votes = new Set(bridgeState.periodProposal.votes);

  votes.add(slotId);
  bridgeState.periodProposal.votes = [...votes];
};
