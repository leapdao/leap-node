const { Tx, Input, Outpoint, Output } = require('leap-core');
const getUnspent = require('./getUnspent');

const PRIV1 =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';
const A1 = '0xB8205608d54cb81f44F263bE086027D8610F3C94';
const A2 = '0xD56F7dFCd2BaFfBC1d885F0266b21C7F2912020c';

describe('getUnspent', () => {
  test('unspent for exitstent addr', async () => {
    const tx1 = Tx.transfer(
      [
        new Input(
          new Outpoint(
            '0x7777777777777777777777777777777777777777777777777777777777777777',
            0
          )
        ),
        new Input(
          new Outpoint(
            '0x7777777777777777777777777777777777777777777777777777777777777777',
            1
          )
        ),
      ],
      [new Output(100, A2, 0), new Output(200, A1, 0), new Output(300, A2, 1)]
    ).signAll(PRIV1);
    const state = {
      unspent: {
        [new Outpoint(tx1.hash(), 0).hex()]: tx1.outputs[0].toJSON(),
        [new Outpoint(tx1.hash(), 1).hex()]: tx1.outputs[1].toJSON(),
        [new Outpoint(tx1.hash(), 2).hex()]: tx1.outputs[2].toJSON(),
      },
    };

    const unspent1 = await getUnspent({ currentState: state }, A1);
    expect(unspent1).toEqual([
      {
        outpoint: new Outpoint(tx1.hash(), 1).hex(),
        output: tx1.outputs[1].toJSON(),
      },
    ]);

    const unspent2 = await getUnspent({ currentState: state }, A2);
    expect(unspent2).toEqual([
      {
        outpoint: new Outpoint(tx1.hash(), 0).hex(),
        output: tx1.outputs[0].toJSON(),
      },
      {
        outpoint: new Outpoint(tx1.hash(), 2).hex(),
        output: tx1.outputs[2].toJSON(),
      },
    ]);
  });

  test('empty unspent list', async () => {
    const state = {
      unspent: {},
    };
    const unspent = await getUnspent({ currentState: state }, '0x000');
    expect(unspent).toEqual([]);
  });
});
