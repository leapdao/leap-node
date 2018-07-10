const updateValidators = require('./updateValidators');
const { getAddress, hexToBase64 } = require('../utils');

const TENDER_KEY_1 = '0x7640D69D9EDB21592CBDF4CC49956EA53E59656FC2D8BBD1AE3F427BF67D47FA'.toLowerCase();
const TENDER_KEY_2 = '0x0000069D9EDB21592CBDF4CC49956EA53E59656FC2D8BBD1AE3F427BF67D47FA'.toLowerCase();
const TENDER_KEY_3 = '0x0000069D9EDB21592CBDF0000000000000000000C2D8BBD1AE3F427BF67D47FA'.toLowerCase();

const mockLastCompleteEpoch = epoch => ({
  methods: {
    lastCompleteEpoch: () => ({
      call: () => Promise.resolve(epoch),
    }),
  },
});

test('Adding new validators', async () => {
  const bridge = mockLastCompleteEpoch(10);
  const chainInfo = {
    validators: {},
  };
  await updateValidators(
    chainInfo,
    [{ tenderKey: TENDER_KEY_1 }, { tenderKey: TENDER_KEY_2 }],
    bridge
  );

  expect(Object.keys(chainInfo.validators).length).toBe(2);
  expect(chainInfo.validators[getAddress(TENDER_KEY_1)].pubKey.data).toBe(
    hexToBase64(TENDER_KEY_1)
  );
  expect(chainInfo.validators[getAddress(TENDER_KEY_1)].power).toBe(10);
  expect(chainInfo.validators[getAddress(TENDER_KEY_2)].pubKey.data).toBe(
    hexToBase64(TENDER_KEY_2)
  );
  expect(chainInfo.validators[getAddress(TENDER_KEY_2)].power).toBe(10);
});

test('Simple removing of a validator (empty slot)', async () => {
  const bridge = mockLastCompleteEpoch(10);
  const chainInfo = {
    validators: {
      [getAddress(TENDER_KEY_1)]: {
        address: getAddress(TENDER_KEY_1),
        pubKey: {
          data: hexToBase64(TENDER_KEY_1),
        },
        power: 10,
      },
      [getAddress(TENDER_KEY_2)]: {
        address: getAddress(TENDER_KEY_2),
        pubKey: {
          data: hexToBase64(TENDER_KEY_2),
        },
        power: 10,
      },
    },
  };
  await updateValidators(
    chainInfo,
    [{ tenderKey: TENDER_KEY_2 }, undefined],
    bridge
  );

  expect(Object.keys(chainInfo.validators).length).toBe(2);
  expect(chainInfo.validators[getAddress(TENDER_KEY_1)]).toBe(0);
  expect(chainInfo.validators[getAddress(TENDER_KEY_2)].pubKey.data).toBe(
    hexToBase64(TENDER_KEY_2)
  );
  expect(chainInfo.validators[getAddress(TENDER_KEY_2)].power).toBe(10);
});

test('Advanced removing of a validator (with activationEpoch)', async () => {
  const bridge = mockLastCompleteEpoch(2);
  const chainInfo = {
    validators: {
      [getAddress(TENDER_KEY_1)]: {
        address: getAddress(TENDER_KEY_1),
        pubKey: {
          data: hexToBase64(TENDER_KEY_1),
        },
        power: 10,
      },
      [getAddress(TENDER_KEY_2)]: {
        address: getAddress(TENDER_KEY_2),
        pubKey: {
          data: hexToBase64(TENDER_KEY_2),
        },
        power: 10,
      },
    },
  };
  await updateValidators(
    chainInfo,
    [
      { tenderKey: TENDER_KEY_2 },
      { tenderKey: TENDER_KEY_1, activationEpoch: 3 },
    ],
    bridge
  );

  expect(Object.keys(chainInfo.validators).length).toBe(2);
  expect(chainInfo.validators[getAddress(TENDER_KEY_1)]).toBe(0);
  expect(chainInfo.validators[getAddress(TENDER_KEY_2)].pubKey.data).toBe(
    hexToBase64(TENDER_KEY_2)
  );
  expect(chainInfo.validators[getAddress(TENDER_KEY_2)].power).toBe(10);
});

test('Validator with several slots', async () => {
  const bridge = mockLastCompleteEpoch(2);
  const chainInfo = {
    validators: {
      [getAddress(TENDER_KEY_1)]: {
        address: getAddress(TENDER_KEY_1),
        pubKey: {
          data: hexToBase64(TENDER_KEY_1),
        },
        power: 10,
      },
      [getAddress(TENDER_KEY_2)]: {
        address: getAddress(TENDER_KEY_2),
        pubKey: {
          data: hexToBase64(TENDER_KEY_2),
        },
        power: 10,
      },
    },
  };
  await updateValidators(
    chainInfo,
    [
      { tenderKey: TENDER_KEY_2 },
      { tenderKey: TENDER_KEY_1, activationEpoch: 3 },
      { tenderKey: TENDER_KEY_2, activationEpoch: 3 },
      { tenderKey: TENDER_KEY_3 },
    ],
    bridge
  );

  expect(Object.keys(chainInfo.validators).length).toBe(3);
  expect(chainInfo.validators[getAddress(TENDER_KEY_1)]).toBe(0);
  expect(chainInfo.validators[getAddress(TENDER_KEY_2)].pubKey.data).toBe(
    hexToBase64(TENDER_KEY_2)
  );
  expect(chainInfo.validators[getAddress(TENDER_KEY_2)].power).toBe(10);
  expect(chainInfo.validators[getAddress(TENDER_KEY_3)].pubKey.data).toBe(
    hexToBase64(TENDER_KEY_3)
  );
  expect(chainInfo.validators[getAddress(TENDER_KEY_3)].power).toBe(10);
});
