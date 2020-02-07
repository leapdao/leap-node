const { GENESIS } = require('../utils');
const handlePeriod = require('./handlePeriod');

jest.mock('./periods/submitPeriod', () => jest.fn());
const submitPeriod = jest.requireMock('./periods/submitPeriod');

jest.mock('./periods/startNewPeriod', () => jest.fn());
const startNewPeriod = jest.requireMock('./periods/startNewPeriod');

jest.mock('../utils/saveSubmission', () => jest.fn());
const saveSubmission = jest.requireMock('../utils/saveSubmission');

const ADDR = '0xb8205608d54cb81f44f263be086027d8610f3c94';

const BLOCKS_ROOT = '0x123';
const PERIOD_ROOT = '0x512';

const state = extend => ({
  lastProcessedPeriodRoot: '0x765',
  submissions: [],
  db: {
    getPeriodDataByBlocksRoot: () => null,
  },
  ...extend,
});

describe('handlePeriod', () => {
  test('middle of the period with no period proposed', async () => {
    const bridgeState = state();
    await handlePeriod(31, bridgeState);
    expect(submitPeriod).not.toBeCalled();
    expect(startNewPeriod).not.toBeCalled();
    expect(saveSubmission).not.toBeCalled();
  });

  test('end of the period with no period proposed', async () => {
    const bridgeState = state();
    await handlePeriod(32, bridgeState);
    expect(submitPeriod).not.toBeCalled();
    expect(startNewPeriod).toBeCalled();
    expect(saveSubmission).not.toBeCalled();
  });

  test('middle of the period with a genesis period proposed', async () => {
    const bridgeState = state({
      periodProposal: {
        height: 64,
        blocksRoot: BLOCKS_ROOT,
        prevPeriodRoot: '0x882233',
      },
      lastProcessedPeriodRoot: GENESIS,
    });

    await handlePeriod(33, bridgeState);
    expect(submitPeriod).toBeCalled();
    expect(startNewPeriod).not.toBeCalled();
    expect(saveSubmission).not.toBeCalled();
  });

  test('middle of the period with a period proposed', async () => {
    const bridgeState = state({
      periodProposal: {
        height: 64,
        blocksRoot: BLOCKS_ROOT,
        prevPeriodRoot: '0x882233',
      },
    });

    await handlePeriod(65, bridgeState);
    expect(submitPeriod).toBeCalled();
    expect(startNewPeriod).not.toBeCalled();
    expect(saveSubmission).not.toBeCalled();
  });

  test('middle of the period with a period proposed, tx for proposal in flight', async () => {
    const bridgeState = state({
      periodProposal: {
        height: 64,
        blocksRoot: BLOCKS_ROOT,
        prevPeriodRoot: '0x882233',
        txHash: '0x12312345611235',
      },
    });

    await handlePeriod(65, bridgeState);
    expect(submitPeriod).not.toBeCalled();
    expect(startNewPeriod).not.toBeCalled();
    expect(saveSubmission).not.toBeCalled();
  });

  test('submission event received, not in db yet, period is onchain', async () => {
    const submissionEvent = {
      casBitmap: '0x8899',
      slotId: 1,
      validatorAddress: ADDR,
      blocksRoot: BLOCKS_ROOT,
      periodRoot: PERIOD_ROOT,
    };
    const periodProposal = {
      height: 64,
      blocksRoot: BLOCKS_ROOT,
      prevPeriodRoot: '0x882233',
    };

    const bridgeState = state({
      periodProposal,
      submissions: {
        [BLOCKS_ROOT]: submissionEvent,
      },
    });

    await handlePeriod(67, bridgeState);

    expect(saveSubmission).toHaveBeenCalledWith(
      periodProposal,
      submissionEvent,
      bridgeState.db
    );
    expect(bridgeState.lastProcessedPeriodRoot).toEqual(PERIOD_ROOT);
    expect(bridgeState.periodProposal).toEqual(null);
  });

  test('proposal is in db already', async () => {
    const bridgeState = state({
      periodProposal: {
        height: 64,
        blocksRoot: BLOCKS_ROOT,
        prevPeriodRoot: '0x882233',
      },
      db: {
        getPeriodDataByBlocksRoot: blocksRoot =>
          blocksRoot === BLOCKS_ROOT
            ? { blocksRoot, periodRoot: PERIOD_ROOT }
            : null,
      },
    });

    await handlePeriod(67, bridgeState);

    expect(submitPeriod).not.toBeCalled();
    expect(startNewPeriod).not.toBeCalled();
    expect(saveSubmission).not.toBeCalled();
    expect(bridgeState.lastProcessedPeriodRoot).toEqual(PERIOD_ROOT);
    expect(bridgeState.periodProposal).toEqual(null);
  });
});
