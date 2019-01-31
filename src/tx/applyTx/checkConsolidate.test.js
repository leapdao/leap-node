const { Tx, Input, Outpoint, Output } = require('leap-core');
const checkConsolidate = require('./checkConsolidate');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';

describe('checkConsolidate', () => {
  test('wrong type', () => {
    const tx = Tx.deposit(1, '123345', ADDR_1);
    expect(() => checkConsolidate({}, tx)).toThrow('Consolidate tx expected');
  });

  test('valid tx', () => {
    const deposit1 = Tx.deposit(12, 500, ADDR_1, 0);
    const deposit2 = Tx.deposit(13, 500, ADDR_1, 0);
    const state = {
      unspent: {
        [new Outpoint(deposit1.hash(), 0).hex()]: deposit1.outputs[0].toJSON(),
        [new Outpoint(deposit2.hash(), 0).hex()]: deposit2.outputs[0].toJSON(),
      },
      gas: {
        minPrice: 0,
      },
    };
    const consolidate = Tx.consolidate(
      [
        new Input(new Outpoint(deposit1.hash(), 0)),
        new Input(new Outpoint(deposit2.hash(), 0)),
      ],
      new Output(1000, ADDR_1, 0)
    );
    checkConsolidate(state, consolidate, {});
  });

  test('with 1 input', () => {
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    const state = {
      unspent: {
        [new Outpoint(deposit.hash(), 0).hex()]: deposit.outputs[0].toJSON(),
      },
      gas: {
        minPrice: 0,
      },
    };

    expect(() => {
      checkConsolidate(
        state,
        Tx.consolidate(
          [new Input(new Outpoint(deposit.hash(), 0))],
          new Output(1000, ADDR_1, 0)
        )
      );
    }).toThrow('Consolidate tx should have > 1 input');
  });

  test('with !== 1 output', () => {
    const deposit1 = Tx.deposit(12, 500, ADDR_1, 0);
    const deposit2 = Tx.deposit(13, 500, ADDR_1, 0);
    const state = {
      unspent: {
        [new Outpoint(deposit1.hash(), 0).hex()]: deposit1.outputs[0].toJSON(),
        [new Outpoint(deposit2.hash(), 0).hex()]: deposit2.outputs[0].toJSON(),
      },
      gas: {
        minPrice: 0,
      },
    };
    const consolidate = Tx.consolidate(
      [
        new Input(new Outpoint(deposit1.hash(), 0)),
        new Input(new Outpoint(deposit2.hash(), 0)),
      ],
      new Output(1000, ADDR_1, 0)
    );
    consolidate.outputs.push(new Output(1000, ADDR_1, 0));
    expect(() => {
      checkConsolidate(state, consolidate);
    }).toThrow('Consolidate tx should have only 1 output');

    consolidate.outputs = [];
    expect(() => {
      checkConsolidate(state, consolidate);
    }).toThrow('Consolidate tx should have only 1 output');
  });
});
