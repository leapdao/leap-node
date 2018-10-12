const getBlockNumber = require('./getBlockNumber');

describe('getBlockNumber', () => {
  test('blockNumber from bridgeState', async () => {
    const blockNumber = await getBlockNumber({ blockHeight: 100 });
    expect(blockNumber).toBe('0x64');
  });
});
