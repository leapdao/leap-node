const { logValidators } = require('../utils/debug');
const activateSlot = require('../txHelpers/activateSlot');
const { getAuctionedByAddr } = require('../utils');

module.exports = (height, bridgeState) => {
  if (height % 32 !== 16) return;

  const { currentState } = bridgeState;

  // check if there is a validator slot that is "waiting for me"
  const myAuctionedSlots = getAuctionedByAddr(
    currentState.slots,
    bridgeState.account.address
  )
    .filter(
      ({ activationEpoch }) => currentState.epoch.epoch - activationEpoch >= 2
    )
    .map(({ id }) => id);

  if (myAuctionedSlots.length > 0) {
    logValidators('found some slots for activation', myAuctionedSlots);
    myAuctionedSlots.forEach(id => {
      const { receiptPromise } = activateSlot(id, bridgeState);
      receiptPromise
        .on('transactionHash', txHash => {
          // istanbul ignore next
          logValidators('activate', id, txHash);
        })
        .catch(err => {
          // istanbul ignore next
          logValidators('activation error', err.message);
        });
    });
  }
};
