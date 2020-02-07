/**
 * Copyright (c) 2019-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
const { Tx, Input, Outpoint } = require('leap-core');

const { logPeriod } = require('../../utils/debug');
const { getSlotsByAddr } = require('../../utils');
const isAlreadyVoted = require('./isAlreadyVoted');

module.exports = async (periodBlocksRoot, periodProposal, bridgeState) => {
  const { account, sender, currentState } = bridgeState;
  const mySlots = getSlotsByAddr(currentState.slots, account.address);

  const isValidator = mySlots.length > 0;

  if (!isValidator || process.env.NO_PERIOD_VOTE) {
    logPeriod(`[period vote] Not a validator`);
    return;
  }

  if (isAlreadyVoted(periodBlocksRoot, mySlots[0].id, periodProposal)) {
    logPeriod(
      `[period vote] Already voted. Slot: ${mySlots[0].id}. Root: ${periodBlocksRoot}`
    );
    return;
  }

  logPeriod(
    `[period vote] Submitting. Slot: ${mySlots[0].id}. Root: ${periodBlocksRoot}`
  );
  const input = new Input(new Outpoint(periodBlocksRoot, 0));
  const periodVoteTx = Tx.periodVote(mySlots[0].id, input).signAll(
    account.privateKey
  );

  await sender.send(periodVoteTx);
};
