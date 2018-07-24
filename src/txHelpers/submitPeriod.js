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

module.exports = async (period, height, { web3, bridge, node, account }) => {
  const submittedPeriod = await bridge.methods
    .periods(period.merkleRoot())
    .call();

  // period not found
  if (submittedPeriod.timestamp === '0') {
    const mySlots = getSlotsByAddr(node.slots, account.address);
    const currentSlotId = getCurrentSlotId(node.slots, height);
    const currentSlot = mySlots.find(slot => slot.id === currentSlotId);
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
        account
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
