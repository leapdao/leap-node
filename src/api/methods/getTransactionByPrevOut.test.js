const { Tx, Input, Outpoint, Output } = require('leap-core');
const txResponse = require('./txResponse');
const getTransactionByPrevOut = require('./getTransactionByPrevOut');

const PRIV1 =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';
const A1 = '0xB8205608d54cb81f44F263bE086027D8610F3C94';

describe('getTransactionByPrevOut', () => {
  test('UTXO is not spent or non existing', async () => {
    const db = {
      async getTransactionByPrevOut() {
        return null;
      },
    };

    expect(await getTransactionByPrevOut(db, '0x00')).toBe(null);
  });

  test('Existent tx', async () => {
    const out1 = new Outpoint(
      '0x7777777777777777777777777777777777777777777777777777777777777777',
      0
    );

    const out2 = new Outpoint(
      '0x6666666666666666666666666666666666666666666666666666666666666666',
      1
    );
    const tx = Tx.transfer(
      [new Input(out1), new Input(out2)],
      [new Output(100, A1, 0)]
    ).signAll(PRIV1);

    const data = {
      txData: tx.toJSON(),
      blockHash: '0x00',
      height: 2,
      txPos: 0,
    };
    const utxoId =
      '0x6666666666666666666666666666666666666666666666666666666666666666:1';
    const db = {
      async getTransactionByPrevOut(prevOut) {
        if (prevOut === utxoId) {
          return data;
        }
        return null;
      },
      async getTransaction() {
        return data;
      },
    };

    const response = await getTransactionByPrevOut(db, utxoId);
    expect(response).toEqual(await txResponse(db, tx, '0x00', 2, 0));
  });
});
