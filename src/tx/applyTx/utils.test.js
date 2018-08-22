const { Tx, Input, Outpoint, Output } = require('parsec-lib');
const { checkOutpoints, addOutputs, removeInputs } = require('./utils');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';

describe('applyTx utils', () => {
  describe('checkOutpoints', () => {
    test('non-existent outpoint', () => {
      const state = {
        unspent: {},
      };
      const deposit = Tx.deposit(12, 500, ADDR_1, 0);
      const transfer = Tx.transfer(
        [new Input(new Outpoint(deposit.hash(), 0))],
        [new Output(500, ADDR_1, 0)]
      );

      expect(() => {
        checkOutpoints(state, transfer);
      }).toThrow('Trying to spend non-existing output');
    });

    test('existent outpoint', () => {
      const deposit = Tx.deposit(12, 500, ADDR_1, 0);
      const outpoint = new Outpoint(deposit.hash(), 0);
      const state = {
        unspent: {
          [outpoint.hex()]: deposit.outputs[0].toJSON(),
        },
      };
      const transfer = Tx.transfer(
        [new Input(outpoint)],
        [new Output(500, ADDR_1, 0)]
      );

      checkOutpoints(state, transfer);
    });
  });

  test('addOutputs', () => {
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    const outpoint = new Outpoint(deposit.hash(), 0);
    const state = {
      balances: {},
      owners: {},
      unspent: {},
    };

    addOutputs(state, deposit);
    expect(state.unspent[outpoint.hex()]).toBeDefined();
    expect(state.balances[0][ADDR_1]).toBe(500);
  });

  test('removeInputs', () => {
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    const outpoint = new Outpoint(deposit.hash(), 0);
    const state = {
      balances: {},
      owners: {},
      unspent: {},
    };

    addOutputs(state, deposit);
    expect(state.unspent[outpoint.hex()]).toBeDefined();
    const transfer = Tx.transfer(
      [new Input(outpoint)],
      [new Output(500, ADDR_1, 0)]
    );
    removeInputs(state, transfer);
    expect(state.unspent[outpoint.hex()]).toBeUndefined();
    expect(state.balances[0][ADDR_1]).toBe(0);
  });
});
