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

module.exports = async (period, slots, height, bridgeState) => {
  // query the operator events for period.merkleRoot()
  const submissions = await bridgeState.operatorContract.getPastEvents(
    'Submission',
    {
      filter: {
        blocksRoot: [period.prevHash, period.merkleRoot()],
      },
    }
  );
  console.log('EEEEEEVVVVVEEEENTS:...');
  console.log(submissions);

  // if found
  // use periodRoot to get submittedPeriod
  // if not found
  // try to submit
  // problem: how to get prevHash?

  const submittedPeriod = await bridgeState.bridgeContract.methods
    .periods(period.merkleRoot())
    .call();

  // period not found
  logPeriod('submittedPeriod', period.merkleRoot(), submittedPeriod);
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
          period.prevHash || GENESIS,
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
