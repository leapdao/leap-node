/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const submitPeriod = require('../validator/periods/submitPeriod');
const { logPeriod } = require('../utils/debug');
const getActiveSlots = require('../utils/getActiveSlots');

const getNextSlotToProposeFrom = (periodProposal, bridgeState) => {
  const activeSlots = getActiveSlots(bridgeState.currentState.slots);
  return (periodProposal.proposerSlotId + 1) % activeSlots.length;
};

module.exports = bridgeState => async (rsp, state, chainInfo) => {
  const height = chainInfo.height - 32;

  if (height <= 0) {
    // genesis height doesn't need check
    logPeriod('[checkBridge] Genesis period');
    rsp.status = 1;
    return;
  }

  const periodProposal = bridgeState.stalePeriodProposal;

  if (!periodProposal) {
    logPeriod('[checkBridge] No dragging period submission');
    rsp.status = 1;
    return;
  }

  logPeriod('[checkBridge] Pending period submission', periodProposal);

  rsp.status = 0;
  bridgeState.checkCallsCount += 1;

  const { txHash } = periodProposal;

  if (
    await bridgeState.db.getPeriodDataByBlocksRoot(periodProposal.blocksRoot)
  ) {
    logPeriod('[checkBridge] Found successful submission tx');
    bridgeState.stalePeriodProposal = null;
    bridgeState.db.setStalePeriodProposal(null);
    rsp.status = 1;
    return;
  }

  if (bridgeState.checkCallsCount > 1 && bridgeState.checkCallsCount < 10) {
    logPeriod(
      `[checkBridge] Waiting for slot ${periodProposal.proposerSlotId} to finish submission`
    );
    return;
  }
  bridgeState.checkCallsCount = 1;
  const txOpts = {};

  if (!txHash) {
    // proposer didn't submit period on time, assign another proposer slot
    logPeriod(
      '[checkBridge] No submission from proposer on time. Submitting from a next slot'
    );
    periodProposal.proposerSlotId = getNextSlotToProposeFrom(
      periodProposal,
      bridgeState
    );
  } else {
    // we have txHash in proposal, so submission is either failed or
    // stuck in a mempool (underpriced?)
    const receipt = await bridgeState.web3.eth.getTransactionReceipt(txHash);

    if (!receipt) {
      // in a mempool
      logPeriod(
        '[checkBridge] No receipt yet, probably stuck in a mempool as underpriced. Resubmitting'
      );
      const tx = await bridgeState.web3.eth.getTransaction(txHash);
      txOpts.nonce = tx.nonce;
    } else if (!receipt.status) {
      // status = 0, tx failed
      logPeriod(
        '[checkBridge] Found failed submission. Resubmitting from the next slot'
      );
      periodProposal.proposerSlotId = getNextSlotToProposeFrom(
        periodProposal,
        bridgeState
      );
    } else {
      // status = 1, tx succeed
      logPeriod(
        '[checkBridge] Found successful submission tx. Waiting for Submission event to arrive..'
      );
      rsp.status = 0;
      return;
    }
  }

  bridgeState.db.setStalePeriodProposal(periodProposal);

  await submitPeriod(periodProposal, bridgeState, txOpts);
};
