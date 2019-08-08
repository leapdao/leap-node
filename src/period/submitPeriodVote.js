/**
 * Copyright (c) 2019-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
const { Tx, Input, Outpoint } = require('leap-core');

const { logNode } = require('../utils/debug');
const { getSlotsByAddr } = require('../utils');

const alreadyVoted = (periodRoot, slotId, periodVotes) =>
  (periodVotes[periodRoot] || []).indexOf(slotId) >= 0;

module.exports = async (period, bridgeState, { send }) => {
  const { periodVotes, slots } = bridgeState.currentState;
  const periodRoot = period.merkleRoot();

  const mySlots = getSlotsByAddr(slots, bridgeState.account.address);

  const isValidator = mySlots.length > 0;

  if (!isValidator || process.env.NO_PERIOD_VOTE) {
    return;
  }

  if (alreadyVoted(periodRoot, mySlots[0].id, periodVotes)) {
    logNode(
      `[period vote] Already submitted. Slot: ${mySlots[0].id}. Root: ${periodRoot}`
    );
    return;
  }

  const input = new Input(new Outpoint(periodRoot, 0));
  const periodVoteTx = Tx.periodVote(mySlots[0].id, input).signAll(
    bridgeState.account.privateKey
  );

  await send(periodVoteTx);
};
