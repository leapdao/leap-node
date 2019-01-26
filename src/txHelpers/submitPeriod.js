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
const eventDistance = 4 * 120; // about 2 hours on main-net

module.exports = async (period, slots, height, bridgeState) => {
  // query the contracts for submissions
  // to find the period roots to the merkle roots
  const parentHeight = await bridgeState.web3.eth.getBlockNumber();
  const submissions = await bridgeState.operatorContract.getPastEvents(
    'Submission',
    {
      filter: {
        blocksRoot: [period.prevHash, period.merkleRoot()],
      },
      fromBlock: parentHeight - eventDistance,
    }
  );

  let submittedPeriod = { timestamp: '0' };

  // if last period not submitted, only period.prevHash would find an event
  // if currentt period submitted already, period.merkleRoot() would also match
  let prevPeriodRoot;
  let currentPeriodRoot;
  for (let i = 0; i < submissions.length; i += 1) {
    if (submissions[i].returnValues.blocksRoot === period.prevHash) {
      prevPeriodRoot = submissions[i].returnValues.periodRoot;
    }
    if (submissions[i].returnValues.blocksRoot === period.merkleRoot()) {
      currentPeriodRoot = submissions[i].returnValues.periodRoot;
    }
  }

  if (currentPeriodRoot) {
    submittedPeriod = await bridgeState.bridgeContract.methods
      .periods(currentPeriodRoot)
      .call();
    logPeriod('submittedPeriod', period.merkleRoot(), submittedPeriod);
  }

  if (submittedPeriod.timestamp === '0') {
    const mySlots = getSlotsByAddr(slots, bridgeState.account.address);
    const currentSlotId = getCurrentSlotId(slots, height);
    const currentSlot = mySlots.find(slot => slot.id === currentSlotId);
    logPeriod('mySlots', currentSlotId, mySlots);
    if (currentSlot) {
      logPeriod('submitPeriod. Slot %d', currentSlot.id);
      const tx = sendTransaction(
        bridgeState.web3,
        bridgeState.operatorContract.methods.submitPeriod(
          currentSlot.id,
          prevPeriodRoot || GENESIS,
          period.merkleRoot()
        ),
        bridgeState.operatorContract.options.address,
        bridgeState.account
      ).catch(logError(height));

      tx.then(receipt => {
        logPeriod('submitPeriod tx', receipt);
      });
    }
  }

  return submittedPeriod;
};
