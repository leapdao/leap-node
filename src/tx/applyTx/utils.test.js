const { Tx, Input, Outpoint, Output } = require('parsec-lib');
const { checkOutpoints, addOutputs, removeInputs } = require('./utils');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';
const STORAGE_ROOT =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';

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
      unspent: {},
    };

    addOutputs(state, deposit);
    expect(state.unspent[outpoint.hex()]).toBeDefined();
    expect(state.balances[0][ADDR_1]).toBe(500);
  });

  test('addOutputs (computations)', () => {
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    const compResp = Tx.compResponse(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [
        new Output({
          address: ADDR_1,
          value: 0,
          color: 0,
          storageRoot: STORAGE_ROOT,
        }),
      ]
    );
    const outpoint = new Outpoint(compResp.hash(), 0);
    const state = {
      balances: {},
      unspent: {},
      storageRoots: {},
    };

    addOutputs(state, compResp);
    expect(state.unspent[outpoint.hex()]).toBeDefined();
    expect(state.storageRoots[ADDR_1]).toBe(STORAGE_ROOT);
  });

  test('removeInputs', () => {
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    const outpoint = new Outpoint(deposit.hash(), 0);
    const state = {
      balances: {},
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
