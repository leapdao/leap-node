/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Period } = require('leap-core');
const submitPeriodVote = require('../period/submitPeriodVote');
const submitPeriod = require('../txHelpers/submitPeriod');
const activateSlot = require('../txHelpers/activateSlot');
const { getAuctionedByAddr } = require('../utils');
const { logPeriod } = require('../utils/debug');

module.exports = async (
  state,
  chainInfo,
  bridgeState,
  nodeConfig = {},
  sender
) => {
  if (chainInfo.height % 32 === 0) {
    logPeriod('updatePeriod');
    try {
      await submitPeriodVote(
        bridgeState.currentPeriod,
        state,
        bridgeState,
        sender
      );

      await submitPeriod(
        bridgeState.currentPeriod,
        state.slots,
        chainInfo.height,
        bridgeState,
        nodeConfig
      );
    } catch (err) {
      logPeriod(`period vote: ${err}`);
    }
    bridgeState.previousPeriod = bridgeState.currentPeriod;
    bridgeState.currentPeriod = new Period(
      bridgeState.previousPeriod.merkleRoot()
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
    if (myAuctionedSlots.length > 0 && !nodeConfig.readonly) {
      logPeriod('found some slots for activation', myAuctionedSlots);
      myAuctionedSlots.forEach(id => {
        const tx = activateSlot(id, bridgeState);
        /* istanbul ignore next */
        tx.catch(err => {
          logPeriod('activation error', err.message);
        });
        /* istanbul ignore next */
        if (typeof tx.on === 'function') {
          /* istanbul ignore next */
          tx.on('transactionHash', txHash => {
            logPeriod('activate', id, txHash);
          });
        }
      });
    }
  }
};
