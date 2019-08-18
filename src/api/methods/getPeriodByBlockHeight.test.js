const getPeriodByBlockHeight = require('./getPeriodByBlockHeight');

const periods = {
  0: [{ casBitmap: '0x123', slotId: 0, validatorAddress: '0xabc' }],
  32: [{ casBitmap: '0x456', slotId: 1, validatorAddress: '0xdef' }],
  96: [
    { casBitmap: '0x123', slotId: 0, validatorAddress: '0xabc' },
    { casBitmap: '0x456', slotId: 1, validatorAddress: '0xdef' },
  ],
};

const db = {
  async getPeriodData(height) {
    return periods[height];
  },
};

describe('getPeriodByBlockHeight', () => {
  test('No period for block height', async () => {
    expect(await getPeriodByBlockHeight(db, 64)).toBe(null);
  });

  test('existing data', async () => {
    expect(await getPeriodByBlockHeight(db, 0)).toEqual([
      {
        periodStart: 0,
        periodEnd: 31,
        casBitmap: '0x123',
        slotId: 0,
        validatorAddress: '0xabc',
      },
    ]);

    expect(await getPeriodByBlockHeight(db, 96)).toEqual([
      {
        periodStart: 96,
        periodEnd: 127,
        casBitmap: '0x123',
        slotId: 0,
        validatorAddress: '0xabc',
      },
      {
        periodStart: 96,
        periodEnd: 127,
        casBitmap: '0x456',
        slotId: 1,
        validatorAddress: '0xdef',
      },
    ]);
  });
});
