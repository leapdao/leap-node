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
      // console.log('submitPeriod', currentSlot, submittedPeriod);
      const tx = sendTransaction(
        web3,
        bridge.methods.submitPeriod(
          currentSlot.id,
          node.previousPeriod.prevHash || GENESIS,
          node.previousPeriod.merkleRoot()
        ),
        bridge.options.address,
        account
      ).catch(err => {
        console.log('submitPeriod error: %s (height: %d)', err.message, height);
      });

      if (typeof tx.on === 'function') {
        tx.on('transactionHash', txHash => {
          console.log('submitPeriod', txHash);
        });
      }
    }
  }

  return submittedPeriod;
};
