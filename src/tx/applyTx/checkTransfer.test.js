const { Tx, Input, Outpoint, Output } = require('leap-core');

const checkTransfer = require('./checkTransfer');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';
const PRIV_1 =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';
const ADDR_2 = '0x8ab21c65041778dfc7ec7995f9cdef3d5221a5ad';
const ADDR_3 = '0x418eaa171b93ed13589377cdbe6abf05840543af';
const PRIV_3 =
  '0x9ae3ed3d1659a33902644da4ce645cfac1de84bc0889909db83692c8374fc44e';

describe('checkTransfer', () => {
  test('wrong type', () => {
    const tx = Tx.deposit(0, 0, ADDR_1);
    expect(() => checkTransfer({}, tx, {})).toThrow('Transfer tx expected');
  });

  test('valid tx', () => {
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    const state = {
      unspent: {
        [new Outpoint(deposit.hash(), 0).hex()]: deposit.outputs[0].toJSON(),
      },
    };

    const transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output(500, ADDR_2, 0)]
    ).signAll(PRIV_1);

    checkTransfer(state, transfer, {});
  });

  test('valid tx with multiple colors', () => {
    const deposit1 = Tx.deposit(12, 500, ADDR_1, 0);
    const deposit2 = Tx.deposit(13, 500, ADDR_1, 1);
    const state = {
      unspent: {
        [new Outpoint(deposit1.hash(), 0).hex()]: deposit1.outputs[0].toJSON(),
        [new Outpoint(deposit2.hash(), 0).hex()]: deposit2.outputs[0].toJSON(),
      },
    };

    const transfer = Tx.transfer(
      [
        new Input(new Outpoint(deposit1.hash(), 0)),
        new Input(new Outpoint(deposit2.hash(), 0)),
      ],
      [new Output(500, ADDR_2, 0), new Output(500, ADDR_2, 1)]
    ).signAll(PRIV_1);
    checkTransfer(state, transfer, {});
  });

  test('wrong color', () => {
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    const state = {
      unspent: {
        [new Outpoint(deposit.hash(), 0).hex()]: deposit.outputs[0].toJSON(),
      },
    };

    const transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output(500, ADDR_2, 1)]
    ).signAll(PRIV_1);
    expect(() => {
      checkTransfer(state, transfer, {});
    }).toThrow('Ins and outs values are mismatch');
  });

  test('unowned output', () => {
    const deposit = Tx.deposit(12, 500, ADDR_2, 0);
    const state = {
      unspent: {
        [new Outpoint(deposit.hash(), 0).hex()]: deposit.outputs[0].toJSON(),
      },
    };

    const transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output(500, ADDR_1, 0)]
    ).signAll(PRIV_1);
    try {
      checkTransfer(state, transfer, {});
    } catch (e) {
      expect(e.message).toBe('Wrong inputs');
    }
  });

  test('several outputs', () => {
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    const transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output(300, ADDR_2, 0), new Output(200, ADDR_3, 0)]
    ).signAll(PRIV_1);
    const state = {
      unspent: {
        [new Outpoint(transfer.hash(), 0).hex()]: transfer.outputs[0].toJSON(),
        [new Outpoint(transfer.hash(), 1).hex()]: transfer.outputs[1].toJSON(),
      },
    };

    const transfer2 = Tx.transfer(
      [new Input(new Outpoint(transfer.hash(), 1))],
      [new Output(100, ADDR_1, 0), new Output(100, ADDR_3, 0)]
    ).sign([PRIV_3]);
    checkTransfer(state, transfer2, {});
  });

  test('several inputs', () => {
    const deposit1 = Tx.deposit(12, 500, ADDR_1, 0);
    const deposit2 = Tx.deposit(13, 500, ADDR_1, 0);
    const state = {
      unspent: {
        [new Outpoint(deposit1.hash(), 0).hex()]: deposit1.outputs[0].toJSON(),
        [new Outpoint(deposit2.hash(), 0).hex()]: deposit2.outputs[0].toJSON(),
      },
    };

    const transfer = Tx.transfer(
      [
        new Input(new Outpoint(deposit1.hash(), 0)),
        new Input(new Outpoint(deposit2.hash(), 0)),
      ],
      [new Output(1000, ADDR_2, 0)]
    ).sign([PRIV_1, PRIV_1]);
    checkTransfer(state, transfer, {});
  });

  test('inputs/outputs mismatch', () => {
    const deposit1 = Tx.deposit(12, 500, ADDR_1, 0);
    const deposit2 = Tx.deposit(13, 500, ADDR_1, 0);
    const state = {
      unspent: {
        [new Outpoint(deposit1.hash(), 0).hex()]: deposit1.outputs[0].toJSON(),
        [new Outpoint(deposit2.hash(), 0).hex()]: deposit2.outputs[0].toJSON(),
      },
    };

    const transfer = Tx.transfer(
      [
        new Input(new Outpoint(deposit1.hash(), 0)),
        new Input(new Outpoint(deposit2.hash(), 0)),
      ],
      [new Output(1200, ADDR_2, 0)]
    ).sign([PRIV_1, PRIV_1]);
    try {
      checkTransfer(state, transfer, {});
    } catch (e) {
      expect(e.message).toBe('Ins and outs values are mismatch for color 0');
    }
  });

  /* Proof for https://github.com/leapdao/leap-node/issues/143 */
  test('try to inflate by tx with small amount', () => {
    const deposit = Tx.deposit(12, '10000000000000000000', ADDR_1, 0);
    const state = {
      unspent: {
        [new Outpoint(deposit.hash(), 0).hex()]: deposit.outputs[0].toJSON(),
      },
    };

    const transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [
        new Output('10000000000000000000', ADDR_1, 0),
        new Output('1000', ADDR_2, 0),
      ]
    ).signAll(PRIV_1);

    expect(() => {
      checkTransfer(state, transfer, {});
    }).toThrow('Ins and outs values are mismatch');
  });

  test('tx with 0 value out', () => {
    const deposit = Tx.deposit(12, '1000', ADDR_1, 0);
    const state = {
      unspent: {
        [new Outpoint(deposit.hash(), 0).hex()]: deposit.outputs[0].toJSON(),
      },
    };

    const transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output('1000', ADDR_1, 0), new Output('0', ADDR_2, 0)]
    ).signAll(PRIV_1);

    console.log(transfer);

    expect(() => {
      checkTransfer(state, transfer, {});
    }).toThrow('One of the outs has value < 1');
  });

  test('try to send tx with negative value out', () => {
    const deposit = Tx.deposit(12, 1000, ADDR_1, 0);
    const state = {
      unspent: {
        [new Outpoint(deposit.hash(), 0).hex()]: deposit.outputs[0].toJSON(),
      },
    };

    const transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output('1001', ADDR_1, 0), new Output(-1, ADDR_2, 0)]
    ).signAll(PRIV_1);

    console.log(transfer);

    expect(() => {
      checkTransfer(state, transfer, {});
    }).toThrow('One of the outs has value < 1');
  });
});
