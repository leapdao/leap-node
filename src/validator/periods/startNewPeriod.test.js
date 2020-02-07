/**
 * Copyright (c) 2019-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Period } = require('leap-core');
const startNewPeriod = require('./startNewPeriod');
const { GENESIS } = require('../../utils');

jest.mock('./submitPeriodVote');
const submitPeriodVote = jest.requireMock('./submitPeriodVote');

jest.mock('../../utils/getCurrentSlotId');
const getCurrentSlotId = require('../../utils/getCurrentSlotId');

getCurrentSlotId.mockImplementation(() => 0);

const state = extend => ({
  currentPeriod: {
    merkleRoot: () => '0x123',
    blockList: [],
  },
  currentState: {
    slots: [{ id: 0 }, { id: 1 }],
  },
  lastProcessedPeriodRoot: '0x456',
  saveNodeState: jest.fn(),
  db: {
    setStalePeriodProposal: jest.fn(),
  },
  ...extend,
});

describe('startNewPeriod', () => {
  test('at the end of the period', async () => {
    const bridgeState = state();
    await startNewPeriod(64, bridgeState);
    expect(bridgeState.periodProposal).toEqual({
      height: 64,
      proposerSlotId: 0,
      votes: [],
      blocksRoot: '0x123',
      prevPeriodRoot: '0x456',
    });
    expect(getCurrentSlotId).toBeCalledWith(bridgeState.currentState.slots, 64);
    expect(bridgeState.saveNodeState).toBeCalled();
    expect(bridgeState.stalePeriodProposal).toEqual(undefined);
    expect(submitPeriodVote).toBeCalledWith(
      '0x123',
      bridgeState.periodProposal,
      bridgeState
    );
    expect(bridgeState.currentPeriod).toEqual(new Period('0x123'));
  });

  test('at the end of the period, previous proposal is not landed yet', async () => {
    const previousProposal = {
      height: 32,
      proposerSlotId: 0,
      votes: [],
      blocksRoot: '0x321',
      prevPeriodRoot: '0x654',
    };
    const bridgeState = state({
      periodProposal: previousProposal,
    });
    await startNewPeriod(64, bridgeState);
    expect(bridgeState.periodProposal).toEqual({
      height: 64,
      proposerSlotId: 0,
      votes: [],
      blocksRoot: '0x123',
      prevPeriodRoot: '0x456',
    });
    expect(getCurrentSlotId).toBeCalledWith(bridgeState.currentState.slots, 64);
    expect(bridgeState.saveNodeState).toBeCalled();
    expect(bridgeState.db.setStalePeriodProposal).toBeCalled();
    expect(bridgeState.stalePeriodProposal).toEqual(previousProposal);
    expect(submitPeriodVote).toBeCalledWith(
      '0x123',
      bridgeState.periodProposal,
      bridgeState
    );
    expect(bridgeState.currentPeriod).toEqual(new Period('0x123'));
  });

  test('at the end of the period, proposal for the period already exists', async () => {
    const periodProposal = {
      height: 64,
      proposerSlotId: 0,
      votes: [],
      blocksRoot: '0x12356',
      prevPeriodRoot: '0x456',
    };

    const bridgeState = state({
      periodProposal,
    });
    await startNewPeriod(64, bridgeState);
    expect(bridgeState.periodProposal).toEqual(periodProposal);
    expect(bridgeState.saveNodeState).not.toBeCalled();
    expect(submitPeriodVote).not.toBeCalled();
    expect(bridgeState.currentPeriod).toEqual(new Period('0x12356'));
  });

  test('at the end of the genesis period', async () => {
    const bridgeState = state({ lastProcessedPeriodRoot: GENESIS });
    await startNewPeriod(32, bridgeState);
    expect(bridgeState.periodProposal).toEqual({
      height: 32,
      proposerSlotId: 0,
      votes: [],
      blocksRoot: '0x123',
      prevPeriodRoot: GENESIS,
    });
    expect(getCurrentSlotId).toBeCalledWith(bridgeState.currentState.slots, 32);
    expect(bridgeState.saveNodeState).toBeCalled();
    expect(submitPeriodVote).toBeCalledWith(
      '0x123',
      bridgeState.periodProposal,
      bridgeState
    );
    expect(bridgeState.currentPeriod).toEqual(new Period('0x123'));
  });

  test('not the end of the period', async () => {
    const bridgeState = state();
    await startNewPeriod(31, bridgeState);
    expect(bridgeState.periodProposal).not.toBeDefined();
    expect(bridgeState.saveNodeState).not.toBeCalled();
    expect(submitPeriodVote).not.toBeCalled();
  });
});
