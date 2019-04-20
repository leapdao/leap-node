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
  test('wrong type', () => {
    const tx = Tx.transfer([], []);
    expect(() => checkExit({}, tx)).toThrow('Exit tx expected');
  });

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

  test('not 1 input', () => {
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    const outpoint = new Outpoint(deposit.hash(), 0);
    const state = {
      unspent: {
        [outpoint.hex()]: deposit.outputs[0].toJSON(),
      },
    };

    const exit = Tx.exit(new Input(outpoint));
    exit.inputs.push(new Input(outpoint));
    expect(() =>
      checkExit(state, exit, makeExitMock(ADDR_1, '500', 0))
    ).toThrow('Exit tx should have one input');
  });

  test('non-existent exit', () => {
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

  test('non-existent utxo', () => {
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    const outpoint = new Outpoint(deposit.hash(), 0);
    const state = {
      unspent: {},
    };

    const exit = Tx.exit(new Input(outpoint));
    expect(() => {
      checkExit(state, exit, makeExitMock(ADDR_1, '500', 0));
    }).toThrow('Trying to submit incorrect exit');
  });

  test('wrong amount: erc20', () => {
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

  test('wrong amount: erc721', () => {
    const color = 32769 + 1;
    const deposit = Tx.deposit(12, '500', ADDR_1, color);
    const outpoint = new Outpoint(deposit.hash(), 0);
    const state = {
      unspent: {
        [outpoint.hex()]: deposit.outputs[0].toJSON(),
      },
    };
    const exit = Tx.exit(new Input(outpoint));
    expect(() => {
      checkExit(state, exit, makeExitMock(ADDR_1, '600', color));
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
