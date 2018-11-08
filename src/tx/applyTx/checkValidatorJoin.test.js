const { Tx } = require('leap-core');

const checkValidatorJoin = require('./checkValidatorJoin');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';
const ADDR_2 = '0x8ab21c65041778dfc7ec7995f9cdef3d5221a5ad';
const TENDER_KEY_1 = '0x7640D69D9EDB21592CBDF4CC49956EA53E59656FC2D8BBD1AE3F427BF67D47FA'.toLowerCase();
const TENDER_KEY_2 = '0x0000069D9EDB21592CBDF4CC49956EA53E59656FC2D8BBD1AE3F427BF67D47FA'.toLowerCase();

const getInitialState = () => ({
  processedDeposit: 11,
  slots: [],
});

describe('checkValidatorJoin', () => {
  test('successful tx (empty slot)', () => {
    const state = getInitialState();

    const join = Tx.validatorJoin(0, TENDER_KEY_1, 1, ADDR_1);
    checkValidatorJoin(state, join);

    expect(state.slots[0]).toBeDefined();
    expect(state.slots[0].eventsCount).toBe(1);
    expect(state.slots[0].tenderKey).toBe(TENDER_KEY_1);
    expect(state.slots[0].signerAddr).toBe(ADDR_1);
  });

  test('successful validatorJoin tx (leaved)', () => {
    const state = {
      slots: [
        {
          id: 0,
          tenderKey: TENDER_KEY_1,
          signerAddr: ADDR_1,
          eventsCount: 2,
          activationEpoch: 1,
        },
      ],
    };

    const join2 = Tx.validatorJoin(0, TENDER_KEY_2, 3, ADDR_2);
    checkValidatorJoin(state, join2);

    expect(state.slots[0]).toBeDefined();
    expect(state.slots[0].eventsCount).toBe(3);
    expect(state.slots[0].tenderKey).toBe(TENDER_KEY_2);
    expect(state.slots[0].signerAddr).toBe(ADDR_2);
    expect(state.slots[0].activationEpoch).toBeUndefined();
  });

  test('validatorJoin tx with wrong eventsCount (too big)', () => {
    const state = {
      slots: [
        {
          id: 0,
          tenderKey: TENDER_KEY_1,
          signerAddr: ADDR_1,
          eventsCount: 2,
          activationEpoch: 1,
        },
      ],
    };

    const join = Tx.validatorJoin(0, TENDER_KEY_2, 4, ADDR_2);

    expect(() => {
      checkValidatorJoin(state, join);
    }).toThrow('eventsCount expected to be x + 1');
  });

  test('validatorJoin tx with wrong eventsCount (too small)', () => {
    const state = {
      slots: [
        {
          id: 0,
          tenderKey: TENDER_KEY_1,
          signerAddr: ADDR_1,
          eventsCount: 2,
          activationEpoch: 1,
        },
      ],
    };

    const join = Tx.validatorJoin(0, TENDER_KEY_2, 1, ADDR_2);

    expect(() => {
      checkValidatorJoin(state, join);
    }).toThrow('eventsCount expected to be x + 1');
  });

  test('validatorJoin tx with wrong eventsCount (!== 1)', () => {
    const state = getInitialState();

    const join = Tx.validatorJoin(0, TENDER_KEY_1, 2, ADDR_1);

    expect(() => {
      checkValidatorJoin(state, join);
    }).toThrow('eventsCount should start from 1');
  });
});
