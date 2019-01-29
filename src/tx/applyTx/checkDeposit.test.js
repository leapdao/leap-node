const { Tx } = require('leap-core');
const checkDeposit = require('./checkDeposit');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';
const ADDR_2 = '0x8ab21c65041778dfc7ec7995f9cdef3d5221a5ad';

const makeDepositMock = (depositor, amount, color) => {
  return {
    deposits: new Proxy(
      {},
      {
        get: () => ({ depositor, amount, color }),
      }
    ),
  };
};

const getInitialState = () => ({
  processedDeposit: 0,
});

const defaultDepositMock = makeDepositMock(ADDR_1, '500', 0);

describe('checkDeposit', () => {
  test('wrong type', () => {
    const tx = Tx.transfer([], []);
    expect(() => checkDeposit({}, tx)).toThrow('Deposit tx expected');
  });

  test('valid tx', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 0);
    checkDeposit(state, tx, defaultDepositMock);
    expect(state.processedDeposit).toBe(1);
  });

  test('valid tx (non-default color)', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 1);
    checkDeposit(state, tx, makeDepositMock(ADDR_1, '500', '1'));
    expect(state.processedDeposit).toBe(1);
  });

  test('deposit with size 0', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 0, ADDR_1, 1);
    expect(() => {
      checkDeposit(state, tx, makeDepositMock(ADDR_1, '0', '1'));
    }).toThrow('Deposit out has value < 1');
  });

  test('deposit with negative size', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, -1, ADDR_1, 1);
    expect(() => {
      checkDeposit(state, tx, makeDepositMock(ADDR_1, '-1', '1'));
    }).toThrow('Deposit out has value < 1');
  });

  test('valid tx (nft)', () => {
    const state = getInitialState();
    const color = 2 ** 15 + 1;
    const value = '293875120984651807345';
    const tx = Tx.deposit(1, value, ADDR_1, color);
    checkDeposit(state, tx, makeDepositMock(ADDR_1, value, String(color)));
    expect(state.processedDeposit).toBe(1);
  });

  test('non-existent', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 0);

    expect(() => {
      checkDeposit(state, tx, { deposits: {} });
    }).toThrow('Trying to submit incorrect deposit');
  });

  test('skipping depositId', () => {
    const state = getInitialState();
    const tx = Tx.deposit(2, 500, ADDR_1, 0);
    expect(() => {
      checkDeposit(state, tx, defaultDepositMock);
    }).toThrow('Deposit ID skipping ahead. want 1, found 2');
  });

  test('wrong owner', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 0);
    expect(() => {
      checkDeposit(state, tx, makeDepositMock(ADDR_2, '500', 0));
    }).toThrow('Trying to submit incorrect deposit');
  });

  test('wrong value', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 0);
    expect(() => {
      checkDeposit(state, tx, makeDepositMock(ADDR_1, '600', 0));
    }).toThrow('Trying to submit incorrect deposit');
  });

  test('wrong color', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 0);
    expect(() => {
      checkDeposit(state, tx, makeDepositMock(ADDR_1, '600', 1));
    }).toThrow('Trying to submit incorrect deposit');
  });

  test('prevent double deposit', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 0);
    checkDeposit(state, tx, defaultDepositMock);
    expect(() => {
      checkDeposit(state, tx, defaultDepositMock);
    }).toThrow('Deposit ID already used.');
  });

  test('prevent double deposit (spent)', () => {
    const state = getInitialState();
    const deposit = Tx.deposit(1, 500, ADDR_1, 0);
    checkDeposit(state, deposit, defaultDepositMock);

    expect(() => {
      checkDeposit(state, deposit, defaultDepositMock);
    }).toThrow('Deposit ID already used.');
  });

  test('duplicate tx', () => {
    const state = getInitialState();
    const tx = Tx.deposit(1, 500, ADDR_1, 0);
    checkDeposit(state, tx, defaultDepositMock);
    expect(() => {
      checkDeposit(state, tx, defaultDepositMock);
    }).toThrow('Deposit ID already used.');
  });
});
