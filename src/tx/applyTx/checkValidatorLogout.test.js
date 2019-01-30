const { Tx } = require('leap-core');

const checkValidatorLogout = require('./checkValidatorLogout');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';
const ADDR_2 = '0x8ab21c65041778dfc7ec7995f9cdef3d5221a5ad';
const TENDER_KEY_1 = '0x7640D69D9EDB21592CBDF4CC49956EA53E59656FC2D8BBD1AE3F427BF67D47FA'.toLowerCase();
const TENDER_KEY_2 = '0x0000069D9EDB21592CBDF4CC49956EA53E59656FC2D8BBD1AE3F427BF67D47FA'.toLowerCase();

describe('checkValidatorLogout', () => {
  test('wrong type', () => {
    const tx = Tx.deposit(1, '23445', ADDR_1);
    expect(() => checkValidatorLogout({}, tx)).toThrow(
      'validatorJoin tx expected'
    );
  });

  test('successful validatorLogout tx', () => {
    const state = {
      slots: [
        {
          id: 0,
          tenderKey: TENDER_KEY_1,
          signerAddr: ADDR_1,
          eventsCount: 1,
        },
      ],
    };

    const logout = Tx.validatorLogout(0, TENDER_KEY_1, 2, 10, ADDR_2);
    checkValidatorLogout(state, logout);

    expect(state.slots[0]).toBeDefined();
    expect(state.slots[0].eventsCount).toBe(2);
    expect(state.slots[0].tenderKey).toBe(TENDER_KEY_1);
    expect(state.slots[0].activationEpoch).toBe(10);
    expect(state.slots[0].signerAddr).toBe(ADDR_1);
    expect(state.slots[0].newSigner).toBe(ADDR_2);
  });

  test('validatorLogout tx for empty slot', () => {
    const state = { slots: [] };

    const logout = Tx.validatorLogout(0, TENDER_KEY_1, 0, 10, ADDR_1);
    expect(() => {
      checkValidatorLogout(state, logout);
    }).toThrow('Slot 0 is empty');
  });

  test('validatorJoin tx with wrong eventsCount (too big)', () => {
    const state = {
      slots: [
        {
          id: 0,
          tenderKey: TENDER_KEY_1,
          signerAddr: ADDR_1,
          eventsCount: 1,
          activationEpoch: 1,
        },
      ],
    };

    const tx = Tx.validatorLogout(0, TENDER_KEY_2, 3, 0, ADDR_2);

    expect(() => {
      checkValidatorLogout(state, tx);
    }).toThrow('eventsCount expected to be x + 1');
  });
});
