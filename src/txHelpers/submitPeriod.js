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

module.exports = async (period, height, { web3, bridge, node, account }) => {
  const submittedPeriod = await bridge.methods
    .periods(node.previousPeriod.merkleRoot())
    .call();

  // period not found
  if (submittedPeriod.timestamp === '0') {
    const mySlots = getSlotsByAddr(node.slots, account.address);
    const currentSlotId = getCurrentSlotId(node.slots, height);
    const currentSlot = mySlots.find(slot => slot.id === currentSlotId);
    if (currentSlot) {
      const txHash = await sendTransaction(
        web3,
        bridge.methods.submitPeriod(
          currentSlot.id,
          node.previousPeriod.prevHash || GENESIS,
          node.previousPeriod.merkleRoot()
        ),
        bridge.options.address,
        account
      );
      console.log(txHash);
    }
  }

  return submittedPeriod;
};
