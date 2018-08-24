const { Tx, Input, Outpoint, Output } = require('parsec-lib');
const {
  checkOutpoints,
  checkInsAndOuts,
  addOutputs,
  removeInputs,
} = require('./utils');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';
const PRIV_1 =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';

describe('applyTx utils', () => {
  describe('checkInsAndOuts', () => {
    test('ERC20', () => {
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
      ).signAll(PRIV_1);
      checkInsAndOuts(
        transfer,
        state,
        ({ address }, i) => address === transfer.inputs[i].signer
      );
    });

    test('ERC721', () => {
      const color = 2 ** 15 + 1;
      const deposit = Tx.deposit(12, 500, ADDR_1, color);
      const outpoint = new Outpoint(deposit.hash(), 0);
      const state = {
        unspent: {
          [outpoint.hex()]: deposit.outputs[0].toJSON(),
        },
      };
      const transfer = Tx.transfer(
        [new Input(outpoint)],
        [new Output(500, ADDR_1, color)]
      ).signAll(PRIV_1);
      checkInsAndOuts(
        transfer,
        state,
        ({ address }, i) => address === transfer.inputs[i].signer
      );
    });

    test('ERC721 (big value)', () => {
      const color = 2 ** 15 + 1;
      const value =
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      const deposit = Tx.deposit(12, value, ADDR_1, color);
      const outpoint = new Outpoint(deposit.hash(), 0);
      const state = {
        unspent: {
          [outpoint.hex()]: deposit.outputs[0].toJSON(),
        },
      };
      const transfer = Tx.transfer(
        [new Input(outpoint)],
        [new Output(value, ADDR_1, color)]
      ).signAll(PRIV_1);
      checkInsAndOuts(
        transfer,
        state,
        ({ address }, i) => address === transfer.inputs[i].signer
      );
    });

    test('ERC20 + ERC721', () => {
      const colorERC721 = 2 ** 15 + 1;
      const colorERC20 = 0;
      const depositERC20 = Tx.deposit(12, 500, ADDR_1, colorERC20);
      const outpointERC20 = new Outpoint(depositERC20.hash(), 0);
      const depositERC721 = Tx.deposit(12, 500, ADDR_1, colorERC721);
      const outpointERC721 = new Outpoint(depositERC721.hash(), 0);
      const state = {
        unspent: {
          [outpointERC20.hex()]: depositERC20.outputs[0].toJSON(),
          [outpointERC721.hex()]: depositERC721.outputs[0].toJSON(),
        },
      };
      const transfer = Tx.transfer(
        [new Input(outpointERC721), new Input(outpointERC20)],
        [
          new Output(500, ADDR_1, colorERC721),
          new Output(500, ADDR_1, colorERC20),
        ]
      ).signAll(PRIV_1);
      checkInsAndOuts(
        transfer,
        state,
        ({ address }, i) => address === transfer.inputs[i].signer
      );
    });

    test('Ins and outs mismatch ERC20', () => {
      const colorERC721 = 2 ** 15 + 1;
      const colorERC20 = 0;
      const depositERC20 = Tx.deposit(12, 500, ADDR_1, colorERC20);
      const outpointERC20 = new Outpoint(depositERC20.hash(), 0);
      const depositERC721 = Tx.deposit(12, 500, ADDR_1, colorERC721);
      const outpointERC721 = new Outpoint(depositERC721.hash(), 0);
      const state = {
        unspent: {
          [outpointERC20.hex()]: depositERC20.outputs[0].toJSON(),
          [outpointERC721.hex()]: depositERC721.outputs[0].toJSON(),
        },
      };
      const transfer = Tx.transfer(
        [new Input(outpointERC721), new Input(outpointERC20)],
        [
          new Output(500, ADDR_1, colorERC721),
          new Output(400, ADDR_1, colorERC20),
        ]
      ).signAll(PRIV_1);
      expect(() => {
        checkInsAndOuts(
          transfer,
          state,
          ({ address }, i) => address === transfer.inputs[i].signer
        );
      }).toThrow(`Ins and outs values are mismatch for color ${colorERC20}`);
    });

    test('Ins and outs mismatch ERC721', () => {
      const colorERC721 = 2 ** 15 + 1;
      const colorERC20 = 0;
      const depositERC20 = Tx.deposit(12, 500, ADDR_1, colorERC20);
      const outpointERC20 = new Outpoint(depositERC20.hash(), 0);
      const depositERC721 = Tx.deposit(12, 500, ADDR_1, colorERC721);
      const outpointERC721 = new Outpoint(depositERC721.hash(), 0);
      const state = {
        unspent: {
          [outpointERC20.hex()]: depositERC20.outputs[0].toJSON(),
          [outpointERC721.hex()]: depositERC721.outputs[0].toJSON(),
        },
      };
      const transfer = Tx.transfer(
        [new Input(outpointERC721), new Input(outpointERC20)],
        [
          new Output(400, ADDR_1, colorERC721),
          new Output(500, ADDR_1, colorERC20),
        ]
      ).signAll(PRIV_1);
      expect(() => {
        checkInsAndOuts(
          transfer,
          state,
          ({ address }, i) => address === transfer.inputs[i].signer
        );
      }).toThrow(`Ins and outs values are mismatch for color ${colorERC721}`);
    });
  });

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

  describe('addOuputs', () => {
    test('ERC20', () => {
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

    test('ERC721', () => {
      const color = 2 ** 15 + 1;
      const value1 =
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      const value2 =
        '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa';
      const deposit1 = Tx.deposit(12, value1, ADDR_1, color);
      const outpoint1 = new Outpoint(deposit1.hash(), 0);
      const deposit2 = Tx.deposit(12, value2, ADDR_1, color);
      const outpoint2 = new Outpoint(deposit2.hash(), 0);
      const state = {
        balances: {},
        owners: {},
        unspent: {},
      };

      addOutputs(state, deposit1);
      expect(state.unspent[outpoint1.hex()]).toBeDefined();
      expect(state.balances[color][ADDR_1]).toEqual([value1]);
      addOutputs(state, deposit2);
      expect(state.unspent[outpoint2.hex()]).toBeDefined();
      expect(state.balances[color][ADDR_1]).toEqual([value1, value2]);
    });
  });

  describe('removeInputs', () => {
    test('ERC20', () => {
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

    test('ERC721', () => {
      const color = 2 ** 15 + 1;
      const value1 =
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      const value2 =
        '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa';
      const deposit1 = Tx.deposit(12, value1, ADDR_1, color);
      const deposit2 = Tx.deposit(12, value2, ADDR_1, color);
      const outpoint1 = new Outpoint(deposit1.hash(), 0);
      const outpoint2 = new Outpoint(deposit2.hash(), 0);
      const state = {
        balances: {},
        owners: {},
        unspent: {},
      };

      addOutputs(state, deposit1);
      expect(state.unspent[outpoint1.hex()]).toBeDefined();
      expect(state.balances[color][ADDR_1]).toEqual([value1]);
      addOutputs(state, deposit2);
      expect(state.unspent[outpoint2.hex()]).toBeDefined();
      expect(state.balances[color][ADDR_1]).toEqual([value1, value2]);

      const transfer1 = Tx.transfer(
        [new Input(outpoint1)],
        [new Output(value1, ADDR_1, color)]
      );
      removeInputs(state, transfer1);
      expect(state.unspent[outpoint1.hex()]).toBeUndefined();
      expect(state.balances[color][ADDR_1]).toEqual([value2]);

      const transfer2 = Tx.transfer(
        [new Input(outpoint2)],
        [new Output(value2, ADDR_1, color)]
      );
      removeInputs(state, transfer2);
      expect(state.unspent[outpoint2.hex()]).toBeUndefined();
      expect(state.balances[color][ADDR_1]).toEqual([]);
    });
  });
});
