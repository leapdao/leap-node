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

module.exports = async (period, slots, height, { web3, bridge, node }) => {
  const submittedPeriod = await bridge.methods
    .periods(period.merkleRoot())
    .call();

  // period not found
  logPeriod('submittedPeriod', submittedPeriod);
  if (submittedPeriod.timestamp === '0') {
    const mySlots = getSlotsByAddr(slots, node.account.address);
    const currentSlotId = getCurrentSlotId(slots, height);
    const currentSlot = mySlots.find(slot => slot.id === currentSlotId);
    logPeriod('mySlots', currentSlotId, mySlots);
    if (currentSlot) {
      logPeriod('submitPeriod. Slot %d', currentSlot.id);
      const tx = sendTransaction(
        web3,
        bridge.methods.submitPeriod(
          currentSlot.id,
          period.prevHash || GENESIS,
          period.merkleRoot()
        ),
        bridge.options.address,
        node.account
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
