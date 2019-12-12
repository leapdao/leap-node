const handlePeriod = require('./handlePeriod');

jest.mock('./periods/submitPeriod', () => jest.fn());
const submitPeriod = jest.requireMock('./periods/submitPeriod');

jest.mock('./periods/startNewPeriod', () => jest.fn());
const startNewPeriod = jest.requireMock('./periods/startNewPeriod');

const state = (extend) => ({
  isReplay: () => false,
  lastBlocksRoot: '0x456',
  ...extend
});

describe('handlePeriod', () => {

  test('middle of the period with no period proposed', async () => {
    await handlePeriod(31, state());
    expect(submitPeriod).not.toBeCalled();
    expect(startNewPeriod).not.toBeCalled();
  });

  test('end of the period with no period proposed', async () => {
    await handlePeriod(32, state());
    expect(submitPeriod).not.toBeCalled();
    expect(startNewPeriod).toBeCalled();
  });

  test('middle of the period with a genesis period proposed', async () => {
    const bridgeState = state({
      periodProposal: {
        blocksRoot: '0x123'
      },
      lastBlocksRoot: null,
    });

    await handlePeriod(33, bridgeState);
    expect(submitPeriod).toBeCalled();
    expect(startNewPeriod).not.toBeCalled();
  });

  test('middle of the period with a period proposed', async () => {
    const bridgeState = state({
      periodProposal: {
        blocksRoot: '0x123'
      },
      lastBlocksRoot: '0x456',
    });

    await handlePeriod(65, bridgeState);
    expect(submitPeriod).toBeCalled();
    expect(startNewPeriod).not.toBeCalled();
  });

  test('middle of the period with a period proposed and found on chain', async () => {
    const bridgeState = state({
      periodProposal: {
        blocksRoot: '0x123'
      },
      lastBlocksRoot: '0x123'
    });
    await handlePeriod(65, bridgeState);
    expect(bridgeState.periodProposal).toEqual(null);
    expect(submitPeriod).not.toBeCalled();
  });

  test('stale period finally found on chain', async () => {
    const bridgeState = state({
      stalePeriodProposal: {
        blocksRoot: '0x123'
      },
      periodProposal: {
        blocksRoot: '0x456'
      },
      lastBlocksRoot: '0x123'
    });
    await handlePeriod(65, bridgeState);
    expect(bridgeState.stalePeriodProposal).toEqual(null);
    expect(submitPeriod).toBeCalled();
  });

  test('replaying txs', async () => {
    await handlePeriod(32, state({ isReplay: () => true, periodProposal: {} }));
    expect(submitPeriod).not.toBeCalled();
    expect(startNewPeriod).not.toBeCalled();
  });

});