const handlePeriod = require('./handlePeriod');

jest.mock('./periods/submitPeriod', () => jest.fn());
const submitPeriod = jest.requireMock('./periods/submitPeriod');

jest.mock('./periods/startNewPeriod', () => jest.fn());
const startNewPeriod = jest.requireMock('./periods/startNewPeriod');

const state = extend => ({
  lastBlocksRoot: '0x456',
  hasSeenPeriod: () => false,
  ...extend,
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
        blocksRoot: '0x123',
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
        blocksRoot: '0x123',
      },
    });

    await handlePeriod(65, bridgeState);
    expect(submitPeriod).toBeCalled();
    expect(startNewPeriod).not.toBeCalled();
  });
});
