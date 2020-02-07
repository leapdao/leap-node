const saveSubmission = require('./saveSubmission');

const dbMock = () => ({
  storeSubmission: jest.fn(),
});

test('saveSubmission', async () => {
  const submission = {
    casBitmap: '0x8899',
    slotId: 1,
    validatorAddress: '0x1111',
    blocksRoot: '0x2222',
    periodRoot: '0x3333',
  };
  const periodProposal = {
    height: 64,
    blocksRoot: '0x1111',
    prevPeriodRoot: '0x4444',
  };
  const db = dbMock();

  await saveSubmission(periodProposal, submission, db);

  expect(db.storeSubmission).toBeCalledWith(32, {
    ...submission,
    prevPeriodRoot: '0x4444',
  });
});
