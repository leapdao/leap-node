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
  test('no period for block height', async () => {
    expect(await getPeriodByBlockHeight({}, db, 64)).toBe(null);
  });

  test('existing period for decimal height', async () => {
    expect(await getPeriodByBlockHeight({}, db, 10)).toEqual([
      {
        periodStart: 0,
        periodEnd: 31,
        casBitmap: '0x123',
        slotId: 0,
        validatorAddress: '0xabc',
      },
    ]);
  });

  test('existing period for hex height', async () => {
    expect(await getPeriodByBlockHeight({}, db, '0x10')).toEqual([
      {
        periodStart: 0,
        periodEnd: 31,
        casBitmap: '0x123',
        slotId: 0,
        validatorAddress: '0xabc',
      },
    ]);
  });

  test("existing period for 'latest' height", async () => {
    expect(
      await getPeriodByBlockHeight({ blockHeight: 20 }, db, 'latest')
    ).toEqual([
      {
        periodStart: 0,
        periodEnd: 31,
        casBitmap: '0x123',
        slotId: 0,
        validatorAddress: '0xabc',
      },
    ]);
  });

  test('multiple submissions', async () => {
    expect(await getPeriodByBlockHeight({}, db, 100)).toEqual([
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
