// eslint-disable-next-line import/no-extraneous-dependencies
const PromiEvent = require('web3-core-promievent');
const handleSlotActivation = require('./handleSlotActivation');

jest.mock('../utils');
const utils = require('../utils');

jest.mock('../txHelpers/activateSlot');
const activateSlot = require('../txHelpers/activateSlot');

const ADDR = '0xb8205608d54cb81f44f263be086027d8610f3c94';

const state = epoch => ({
  currentState: {
    epoch: {
      epoch,
    },
  },
  account: {
    address: ADDR,
  },
});

describe('handleSlotActivation', () => {
  let txPromise;

  beforeEach(() => {
    txPromise = new PromiEvent();
    utils.getAuctionedByAddr.mockReturnValue([{ id: 0, activationEpoch: 2 }]);
    activateSlot.mockReturnValue({ receiptPromise: txPromise.eventEmitter });
  });

  test('height is not x16', async () => {
    await handleSlotActivation(17, state());
    expect(utils.getAuctionedByAddr).not.toBeCalled();
    expect(activateSlot).not.toBeCalled();
  });

  test('height x16, own slot, activationEpoch not reached yet', async () => {
    const bridgeState = state(3);
    await handleSlotActivation(16, bridgeState);

    expect(activateSlot).not.toBeCalled();
  });

  test('height x16, own slot, activationEpoch reached', async () => {
    const bridgeState = state(5);
    await handleSlotActivation(16, bridgeState);

    expect(activateSlot).toBeCalledWith(0, bridgeState);
  });
});
