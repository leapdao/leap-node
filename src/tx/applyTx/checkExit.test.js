const { Tx, Input, Outpoint } = require('leap-core');
const checkExit = require('./checkExit');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';

const makeExitMock = (exitor, amount, color) => {
  return {
    exits: new Proxy(
      {},
      {
        get: () => ({ exitor, amount, color }),
      }
    ),
  };
};

describe('checkExit', () => {
  test('successful tx', () => {
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    const outpoint = new Outpoint(deposit.hash(), 0);
    const state = {
      unspent: {
        [outpoint.hex()]: deposit.outputs[0].toJSON(),
      },
    };

    const exit = Tx.exit(new Input(outpoint));
    checkExit(state, exit, makeExitMock(ADDR_1, '500', 0));
  });

  test('non-existent', () => {
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    const outpoint = new Outpoint(deposit.hash(), 0);
    const state = {
      unspent: {
        [outpoint.hex()]: deposit.outputs[0].toJSON(),
      },
    };
    const exit = Tx.exit(new Input(outpoint));
    expect(() => {
      checkExit(state, exit, { exits: {} });
    }).toThrow('Trying to submit incorrect exit');
  });

  test('wrong amount', () => {
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    const outpoint = new Outpoint(deposit.hash(), 0);
    const state = {
      unspent: {
        [outpoint.hex()]: deposit.outputs[0].toJSON(),
      },
    };
    const exit = Tx.exit(new Input(outpoint));
    expect(() => {
      checkExit(state, exit, makeExitMock(ADDR_1, '600', 0));
    }).toThrow('Trying to submit incorrect exit');
  });

  test('wrong color', () => {
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    const outpoint = new Outpoint(deposit.hash(), 0);
    const state = {
      unspent: {
        [outpoint.hex()]: deposit.outputs[0].toJSON(),
      },
    };
    const exit = Tx.exit(new Input(outpoint));
    expect(() => {
      checkExit(state, exit, makeExitMock(ADDR_1, '500', 1));
    }).toThrow('Trying to submit incorrect exit');
  });
});
