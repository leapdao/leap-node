/**
 * Copyright (c) 2019-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const startNewPeriod = require('./startNewPeriod');
const { GENESIS } = require('../../utils');

jest.mock('./submitPeriodVote');
const submitPeriodVote = jest.requireMock('./submitPeriodVote');

jest.mock('../../utils/getCurrentSlotId');
const getCurrentSlotId = require('../../utils/getCurrentSlotId');

getCurrentSlotId.mockImplementation(() => 0);

const state = (extend) => ({
  isReplay: () => false,
  currentPeriod: {
    merkleRoot: () => '0x123'
  },
  currentState: {
    slots: [{ id: 0 }, { id: 1 }],
  },
  lastPeriodRoot: '0x456',
  ...extend
})

describe('startNewPeriod', () => {

  test('at the end of the period', async() => {
    const bridgeState = state();
    await startNewPeriod(64, bridgeState);
    expect(bridgeState.periodProposal).toEqual({
      height: 64,
      proposerSlotId: 0,
      votes: [],
      blocksRoot: '0x123',
      prevPeriodRoot: '0x456'
    });
    expect(getCurrentSlotId).toBeCalledWith(bridgeState.currentState.slots, 64);
    expect(submitPeriodVote).toBeCalledWith('0x123', bridgeState);
  });

  test('at the end of the genesis period', async() => {
    const bridgeState = state({ lastPeriodRoot: undefined });
    await startNewPeriod(32, bridgeState);
    expect(bridgeState.periodProposal).toEqual({
      height: 32,
      proposerSlotId: 0,
      votes: [],
      blocksRoot: '0x123',
      prevPeriodRoot: GENESIS
    });
    expect(getCurrentSlotId).toBeCalledWith(bridgeState.currentState.slots, 32);
    expect(submitPeriodVote).toBeCalledWith('0x123', bridgeState);
  });

  test('not the end of the period', async() => {
    const bridgeState = state();
    await startNewPeriod(31, bridgeState);
    expect(bridgeState.periodProposal).not.toBeDefined();
    expect(submitPeriodVote).not.toBeCalled();
  });

  test('tx replay', async() => {
    const bridgeState = state({ isReplay: () => true });
    await startNewPeriod(32, bridgeState);
    expect(bridgeState.periodProposal).not.toBeDefined();
    expect(submitPeriodVote).not.toBeCalled();
  });
});