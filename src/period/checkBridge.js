/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const {
  getSlotsByAddr,
  readSlots,
  sendTransaction,
  getCurrentSlotId,
  GENESIS,
} = require('../utils');

module.exports = async (
  rsp,
  chainInfo,
  height,
  { node, web3, bridge, account }
) => {
  const period = await bridge.methods
    .periods(node.previousPeriod.merkleRoot())
    .call();

  // period not found
  if (period.timestamp === '0') {
    const slots = await readSlots(bridge);
    const mySlots = getSlotsByAddr(slots, account.address);
    const currentSlotId = getCurrentSlotId(
      slots,
      chainInfo.height + node.checkCallsCount
    );
    const currentSlot = mySlots.find(slot => slot.id === currentSlotId);

    if (currentSlot) {
      await sendTransaction(
        web3,
        bridge.methods.submitPeriod(
          currentSlot.id,
          node.previousPeriod.prevHash || GENESIS,
          node.previousPeriod.merkleRoot()
        ),
        bridge.address,
        account
      );
    }

    rsp.status = 1;
  } else {
    rsp.status = 0;
  }

  node.checkCallsCount += 1;
};
