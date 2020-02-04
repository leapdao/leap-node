const { Tx } = require('leap-core');
const checkDeposit = require('./checkDeposit');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';
const ADDR_2 = '0x8ab21c65041778dfc7ec7995f9cdef3d5221a5ad';

const makeDepositMock = (depositor = ADDR_1, amount = '500', color = 0) => {
  return {
    deposits: {
      1: { depositor, amount, color },
    },
  };
};

const getInitialState = () => ({
  gas: {
    minPrice: 0,
  },
});

describe('checkDeposit', () => {
  test('wrong type', () => {
    const tx = Tx.transfer([], []);
    expect(() => checkDeposit({}, tx)).toThrow('Deposit tx expected');
  });

  test('valid tx', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 0);
    checkDeposit(state, tx, makeDepositMock());
  });

  test('valid tx (non-default color)', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 1);
    checkDeposit(state, tx, makeDepositMock(ADDR_1, '500', 1));
  });

  test('valid tx (nft)', () => {
    const state = getInitialState();
    const color = 2 ** 15 + 1;
    const value = '293875120984651807345';
    const tx = Tx.deposit(1, value, ADDR_1, color);
    checkDeposit(state, tx, makeDepositMock(ADDR_1, value, String(color)));
  });

  test('no deposits', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 0);

    expect(() => {
      checkDeposit(state, tx, { deposits: {} });
    }).toThrow('Unexpected deposit: no Deposit event on the root chain');
  });

  test('not on root chain', () => {
    const state = getInitialState();
    const tx = Tx.deposit(2, 500, ADDR_1, 0);
    expect(() => {
      checkDeposit(state, tx, makeDepositMock());
    }).toThrow('Unexpected deposit: no Deposit event on the root chain');
  });

  test('wrong owner', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 0);
    expect(() => {
      checkDeposit(state, tx, makeDepositMock(ADDR_2, '500', 0));
    }).toThrow(
      'Incorrect deposit tx. DepositId: 1 ' +
        'Expected: 0:500:0x8ab21c65041778dfc7ec7995f9cdef3d5221a5ad:undefined ' +
        'Actual: 0:500:0x4436373705394267350db2c06613990d34621d69:undefined'
    );
  });

  test('wrong value', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 0);
    expect(() => {
      checkDeposit(state, tx, makeDepositMock(ADDR_1, '600', 0));
    }).toThrow(
      'Incorrect deposit tx. DepositId: 1 ' +
        'Expected: 0:600:0x4436373705394267350db2c06613990d34621d69:undefined ' +
        'Actual: 0:500:0x4436373705394267350db2c06613990d34621d69:undefined'
    );
  });

  test('ERC20 deposit < 1', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 2, ADDR_1, 0);
    tx.outputs[0].value = '0';
    expect(() => {
      checkDeposit(state, tx, makeDepositMock(ADDR_1, '0', 0));
    }).toThrow('Deposit out has value < 1');
  });

  test('ERC721 deposit < 1', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 0, ADDR_1, 35000);
    checkDeposit(state, tx, makeDepositMock(ADDR_1, '0', 35000));
  });

  test('wrong color', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 0);
    expect(() => {
      checkDeposit(state, tx, makeDepositMock(ADDR_1, '500', 1));
    }).toThrow(
      'Incorrect deposit tx. DepositId: 1 ' +
        'Expected: 1:500:0x4436373705394267350db2c06613990d34621d69:undefined ' +
        'Actual: 0:500:0x4436373705394267350db2c06613990d34621d69:undefined'
    );
  });

  test('prevent double deposit', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 0);
    const bridgeState = makeDepositMock();
    checkDeposit(state, tx, bridgeState, null, false);
    expect(() => {
      checkDeposit(state, tx, bridgeState, null, false);
    }).toThrow('Deposit ID already used.');
  });

  test('CheckTx can be called multiple times', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 0);
    const bridgeState = makeDepositMock();
    checkDeposit(state, tx, bridgeState, null, true);
    expect(bridgeState.deposits[1].included).toEqual(undefined);
    checkDeposit(state, tx, bridgeState, null, true);
    checkDeposit(state, tx, bridgeState, null, false);
    expect(bridgeState.deposits[1].included).toEqual(true);
    expect(() => {
      checkDeposit(state, tx, bridgeState, null, false);
    }).toThrow('Deposit ID already used.');
  });
});
