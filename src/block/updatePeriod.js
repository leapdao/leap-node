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

module.exports = async (state, chainInfo, bridgeState) => {
  if (chainInfo.height % 32 === 0) {
    logPeriod('updatePeriod');
    bridgeState.previousPeriod = bridgeState.currentPeriod;
    bridgeState.currentPeriod = new Period(
      bridgeState.previousPeriod.merkleRoot()
    );
    submitPeriod(
      bridgeState.previousPeriod,
      state.slots,
      chainInfo.height,
      bridgeState
    );
  }
  if (chainInfo.height % 32 === 16) {
    // check if there is a validator slot that is "waiting for me"
    const myAuctionedSlots = getAuctionedByAddr(
      state.slots,
      bridgeState.account.address
    )
      .filter(({ activationEpoch }) => activationEpoch - state.epoch.epoch >= 2)
      .map(({ id }) => id);
    if (myAuctionedSlots.length > 0) {
      logPeriod('found some slots for activation', myAuctionedSlots);
      myAuctionedSlots.forEach(id => {
        const tx = activateSlot(id, bridgeState);
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
};
