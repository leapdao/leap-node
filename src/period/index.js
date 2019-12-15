/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const submitPeriod = require('../validator/periods/submitPeriod');
const { logPeriod } = require('../utils/debug');

const getNextSlotToProposeFrom = (periodProposal, bridgeState) => {
  const activeSlots = bridgeState.currentState.slots.filter(s => s);
  return (periodProposal.proposerSlotId + 1) % activeSlots.length;
};

module.exports = (bridgeState) => async (
  rsp,
  state,
  chainInfo
) => {
  const height = chainInfo.height - 32;

  if (height <= 0) {
    // genesis height doesn't need check
    logPeriod('[checkBridge] Genesis period');
    rsp.status = 1;
    return;
  }

  if (!bridgeState.periodProposal) {
    logPeriod('[checkBridge] No dragging period submission');
    rsp.status = 1;
    return;
  }

  const { periodProposal } = bridgeState;
  logPeriod('[checkBridge] Pending period submission', periodProposal);

  rsp.status = 0;
    
  const { txHash } = periodProposal;
  const txOpts = {};

  if (!txHash) {
    // proposer didn't submit period on time, assign another proposer slot
    logPeriod(
      '[checkBridge] No submission from proposer on time. Submitting from a next slot'
    );
    periodProposal.proposerSlotId = getNextSlotToProposeFrom(periodProposal, bridgeState);
  } else {
    // we have txHash in proposal, so submission is either failed or 
    // stuck in a mempool (underpriced?)
    const receipt = await bridgeState.web3.eth.getTransactionReceipt(txHash);

    if (!receipt) {
      // in a mempool
      logPeriod('[checkBridge] No receipt yet, probably stuck in a mempool as underpriced. Resubmitting');
      const tx = await bridgeState.web3.eth.getTransaction(txHash);
      txOpts.nonce = tx.nonce;
    } else if (receipt.status !== '1') {
      // status = 0, tx failed
      logPeriod('[checkBridge] Found failed submission. Resubmitting from the next slot');
      periodProposal.proposerSlotId = getNextSlotToProposeFrom(periodProposal, bridgeState);
    } else {
      // status = 1, tx succeed
      logPeriod('[checkBridge] Found successful submission tx. Waiting for Submission event to arrive..');
      rsp.status = 0;
      return;
    }
  }
  
  // use a timeout to relax race conditions (if period submission is fast)
  await new Promise(resolve => {
    setTimeout(async () => {
      const { receiptPromise } = await submitPeriod(
        periodProposal,
        bridgeState,
        txOpts
      );

      receiptPromise.then((receipt) => {
        if (!receipt || receipt.status !== '1') {
          rsp.status = 0;
        }
        if (receipt && receipt.status === '1') {
          rsp.status = 1;
          bridgeState.periodProposal = null; // we probably want to wait for Submission event here
        }
      });

      resolve();
    }, 300);
  });  
  
};
