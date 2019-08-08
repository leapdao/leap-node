/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('leap-core');
const { bufferToHex } = require('ethereumjs-util');

module.exports = async (state, tx) => {
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

  const periodRoot = bufferToHex(tx.inputs[0].prevout.hash);

  if (!state.periodVotes[periodRoot]) {
    state.periodVotes[periodRoot] = [];
  }

  if (state.periodVotes[periodRoot].indexOf(slotId) >= 0) {
    throw new Error(
      `[period vote] Already submitted. Slot: ${slotId}. Root: ${periodRoot}`
    );
  }

  state.periodVotes[periodRoot].push(slotId);
};
