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
} = require('../utils');
const { logPeriod } = require('../utils/debug');

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

module.exports = async (
  period,
  slots,
  height,
  bridgeState,
  nodeConfig = {}
) => {
  const { lastBlocksRoot, lastPeriodRoot } = bridgeState;
  const periodRoot = period.merkleRoot();

  let submittedPeriod = { timestamp: '0' };
  if (lastBlocksRoot === periodRoot) {
    submittedPeriod = await bridgeState.bridgeContract.methods
      .periods(lastPeriodRoot)
      .call();
    logPeriod('submittedPeriod', periodRoot, submittedPeriod);
    return submittedPeriod;
  }

  if (nodeConfig.readonly) {
    logPeriod('Readonly node. Skipping the rest of submitPeriod');
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

    const tx = sendTransaction(
      bridgeState.web3,
      bridgeState.operatorContract.methods.submitPeriod(
        mySlotToSubmit.id,
        prevPeriodRoot,
        periodRoot
      ),
      bridgeState.operatorContract.options.address,
      bridgeState.account
    ).catch(logError(height));

    tx.then(receipt => {
      logPeriod('submitPeriod tx', receipt);
    });
  }

  return submittedPeriod;
};
