/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const {
  getSlotsByAddr,
  sendTransaction,
  getCurrentSlotId,
  GENESIS,
  buildCas,
} = require('../utils');
const { logPeriod } = require('../utils/debug');
const checkEnoughVotes = require('../period/utils/checkEnoughVotes');

const inFlight = {};

/* istanbul ignore next */
const logError = height => err => {
  logPeriod('submitPeriod error: %s (height: %d)', err.message, height);
};

const mySlotToSubmitFor = (slots, height, mySlots) => {
  const currentSlotId = getCurrentSlotId(slots, height);
  logPeriod('mySlots', currentSlotId, mySlots);
  return mySlots.find(slot => slot.id === currentSlotId);
};

const getPrevPeriodRoot = (period, bridgeState) => {
  const { lastBlocksRoot, lastPeriodRoot } = bridgeState;

  if (!lastBlocksRoot) return GENESIS; // not submissions yet = first period to be submitted
  if (lastBlocksRoot === period.prevHash) return lastPeriodRoot; // found
  return null; // not found
};

module.exports = async (period, slots, height, bridgeState) => {
  const { lastBlocksRoot, lastPeriodRoot } = bridgeState;
  const { periodVotes } = bridgeState;
  const periodRoot = period.merkleRoot();

  let submittedPeriod = { timestamp: '0' };

  if (inFlight[periodRoot]) {
    logPeriod('submittedPeriod in flight', periodRoot);
    return submittedPeriod;
  }

  if (lastBlocksRoot === periodRoot) {
    submittedPeriod = await bridgeState.bridgeContract.methods
      .periods(lastPeriodRoot)
      .call();
    logPeriod('submittedPeriod', periodRoot, submittedPeriod);
    return submittedPeriod;
  }

  const mySlots = getSlotsByAddr(slots, bridgeState.account.address);
  const mySlotToSubmit = mySlotToSubmitFor(slots, height, mySlots);

  if (mySlotToSubmit) {
    logPeriod('submitPeriod. Slot %d', mySlotToSubmit.id);

    // always try to use the last submitted one
    const prevPeriodRoot =
      getPrevPeriodRoot(period, bridgeState) || lastPeriodRoot;

    if (!prevPeriodRoot) {
      logPeriod(
        'submitPeriod. Not previous period root found. Skipping submission'
      );
      return submittedPeriod;
    }

    const { result, votes, needed } = checkEnoughVotes(
      periodRoot,
      bridgeState.currentState,
      bridgeState
    );

    if (!result) {
      logPeriod(
        `submitPeriod. Not enough period votes collected: ${votes}/${needed}. Waiting..`
      );
      return submittedPeriod;
    }

    const cas = buildCas(periodVotes[periodRoot]);

    inFlight[periodRoot] = true;

    const tx = sendTransaction(
      bridgeState.web3,
      bridgeState.operatorContract.methods.submitPeriodWithCas(
        mySlotToSubmit.id,
        prevPeriodRoot,
        periodRoot,
        `0x${cas.toString(16)}`
      ),
      bridgeState.operatorContract.options.address,
      bridgeState.account
    ).catch((e) => {
      logPeriod('submitPeriod error', e);
      delete inFlight[periodRoot];
      logError(height);
    });

    tx.then(receipt => {
      logPeriod('submitPeriod tx', receipt);
      delete inFlight[periodRoot];
      if (receipt && receipt.status) {
        bridgeState.submittedPeriods[periodRoot] = true;
      }
    });
  }

  return submittedPeriod;
};
