/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
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
const { logPeriod } = require('../debug');

module.exports = async (period, slots, height, bridgeState) => {
  const submittedPeriod = await bridgeState.contract.methods
    .periods(period.merkleRoot())
    .call();

  // period not found
  logPeriod('submittedPeriod', submittedPeriod);
  if (submittedPeriod.timestamp === '0') {
    const mySlots = getSlotsByAddr(slots, bridgeState.account.address);
    const currentSlotId = getCurrentSlotId(slots, height);
    const currentSlot = mySlots.find(slot => slot.id === currentSlotId);
    logPeriod('mySlots', currentSlotId, mySlots);
    if (currentSlot) {
      logPeriod('submitPeriod. Slot %d', currentSlot.id);
      const tx = sendTransaction(
        bridgeState.web3,
        bridgeState.contract.methods.submitPeriod(
          currentSlot.id,
          period.prevHash || GENESIS,
          period.merkleRoot()
        ),
        bridgeState.contract.options.address,
        bridgeState.account
      ).catch(err => {
        logPeriod('submitPeriod error: %s (height: %d)', err.message, height);
      });

      tx.then(receipt => {
        logPeriod('submitPeriod tx', receipt);
      });
    }
  }

  return submittedPeriod;
};
