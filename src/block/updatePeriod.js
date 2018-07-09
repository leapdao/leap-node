/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Period } = require('parsec-lib');
const submitPeriod = require('../txHelpers/submitPeriod');
const activateSlot = require('../txHelpers/activateSlot');
const { getAuctionedByAddr } = require('../utils');

module.exports = async (chainInfo, options) => {
  const { node, account } = options;
  if (chainInfo.height % 32 === 0) {
    node.previousPeriod = node.currentPeriod;
    node.currentPeriod = new Period(node.previousPeriod.merkleRoot());
    node.checkCallsCount = 0;
    await submitPeriod(node.previousPeriod, chainInfo.height, options);
  }
  if (chainInfo.height % 16 === 0) {
    // check if there is a validator slot that is "waiting for me"
    const myAuctionedSlots = await getAuctionedByAddr(
      node.slots,
      account.address
    );
    const activations = [];
    myAuctionedSlots.forEach(slot => {
      console.log('found some slot for activation: ', slot.id);
      activations.push(activateSlot(slot.id, options));
    });
    await Promise.all(activations);
  }
};
