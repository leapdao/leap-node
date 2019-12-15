/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const {
  getSlotsByAddr,
  sendTransaction,
  buildCas,
} = require('../../utils');
const { logPeriod } = require('../../utils/debug');
const checkEnoughVotes = require('./checkEnoughVotes');
const submitPeriodVote = require('./submitPeriodVote');
const isAlreadyVoted = require('./isAlreadyVoted');

module.exports = async (
  periodProposal,
  bridgeState,
  opts = {}
) => {
  const defaultResponse = { receiptPromise: Promise.resolve() };
  const { proposerSlotId, blocksRoot, prevPeriodRoot } = periodProposal;
  const { currentState, lastBlocksRoot, lastPeriodRoot } = bridgeState;
  const { slots } = currentState;

  logPeriod(
    '[submitPeriod] proposerSlot:%d blocksRoot:%s prevPeriodRoot:%s',
    proposerSlotId, blocksRoot, prevPeriodRoot
  );

  if (lastBlocksRoot === blocksRoot) {
    // check if the period is already onchain
    const submittedPeriod = await bridgeState.bridgeContract.methods
        .periods(lastPeriodRoot)
        .call();
    
    if (submittedPeriod.timestamp === '0') {
      throw new Error('No period found onchain for bridgeState.lastBlocksRoot');
    }

    logPeriod('[submitPeriod] already seen onchain', lastPeriodRoot, submittedPeriod);
    return defaultResponse;
  }

  const mySlots = getSlotsByAddr(slots, bridgeState.account.address);

  if (!mySlots.length) {
    logPeriod('[submitPeriod] No slots. Not a validator');
    return defaultResponse;
  }

  const mySlotToSubmit = mySlots.find(slot => slot.id === proposerSlotId);

  if (!isAlreadyVoted(blocksRoot, mySlots[0].id, periodProposal)) {
    await submitPeriodVote(blocksRoot, bridgeState);
  }
  
  // check if it is our turn to submit period
  if (!mySlotToSubmit) {
    logPeriod('[submitPeriod] Not a proposer. Skipping');
    return defaultResponse;
  }

  // check if we have enough period votes for submission
  const { result, votes, needed } = checkEnoughVotes(blocksRoot, bridgeState);
  
  if (!result) {
    logPeriod(
      `[submitPeriod] Not enough period votes collected: ${votes}/${needed}. Waiting..`
    );
    return defaultResponse;
  }

  const cas = buildCas(periodProposal.votes);
  logPeriod('[submitPeriod] CAS:%s',`0x${cas.toString(16)}`);

  if (periodProposal.txHash) {
    logPeriod('[submitPeriod] Already submitted. txHash: %s', periodProposal.txHash);
    return defaultResponse;
  }

  const { receiptPromise } = await sendTransaction(
    bridgeState.web3,
    bridgeState.operatorContract.methods.submitPeriodWithCas(
      mySlotToSubmit.id,
      prevPeriodRoot,
      blocksRoot,
      `0x${cas.toString(16)}`
    ),
    bridgeState.operatorContract.options.address,
    bridgeState.account,
    opts
  );

  receiptPromise.on('transactionHash', (hash) => {
    logPeriod('[submitPeriod] txHash: ', hash);
    periodProposal.txHash = hash;
  }).then(receipt => {
    logPeriod('[submitPeriod] Receipt', receipt);
  }).catch((e) => {
    // istanbul ignore next
    logPeriod('[submitPeriod] Error', e);
  });

  return { receiptPromise };
};
