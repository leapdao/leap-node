/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Period } = require('parsec-lib');
const {
  getSlotsByAddr,
  readSlots,
  sendTransaction,
  getCurrentSlotId,
  GENESIS,
} = require('../utils');

module.exports = async (state, chainInfo, { bridge, web3, account, node }) => {
  if (chainInfo.height % 32 === 0) {
    node.previousPeriod = node.currentPeriod;
    node.currentPeriod = new Period(node.previousPeriod.merkleRoot());
    node.checkCallsCount = 0;
    const slots = await readSlots(bridge);
    const mySlots = getSlotsByAddr(slots, account.address);
    const currentSlotId = getCurrentSlotId(slots, chainInfo.height);
    const currentSlot = mySlots.find(slot => slot.id === currentSlotId);
    console.log(currentSlot, currentSlotId, 'submitting');
    if (currentSlot) {
      await sendTransaction(
        web3,
        bridge.methods.submitPeriod(
          currentSlot.id,
          node.previousPeriod.prevHash || GENESIS,
          node.previousPeriod.merkleRoot()
        ),
        bridge.options.address,
        account
      );
    }
  }
};
