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
const { logPeriod } = require('../debug');

module.exports = async (chainInfo, options) => {
  try {
    const { node, account } = options;
    if (chainInfo.height % 32 === 0) {
      logPeriod('updatePeriod');
      node.previousPeriod = node.currentPeriod;
      node.currentPeriod = new Period(node.previousPeriod.merkleRoot());
      node.checkCallsCount = 0;
      submitPeriod(node.previousPeriod, chainInfo.height, options);
    }
    if (chainInfo.height % 32 === 16) {
      // ToDo: should try to activate in the right epoch
      // check if there is a validator slot that is "waiting for me"
      const myAuctionedSlots = getAuctionedByAddr(
        node.slots,
        account.address
      ).map(({ id }) => id);
      if (myAuctionedSlots.length > 0) {
        logPeriod('found some slots for activation', myAuctionedSlots);
        myAuctionedSlots.forEach(id => {
          const tx = activateSlot(id, options);
          tx.catch(err => {
            logPeriod('activation error', err.message);
          });
          if (typeof tx.on === 'function') {
            tx.on('transactionHash', txHash => {
              logPeriod('activate', id, txHash);
            });
          }
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
};
