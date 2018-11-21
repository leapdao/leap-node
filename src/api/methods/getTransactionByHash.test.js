const { Tx, Input, Outpoint, Output } = require('leap-core');
const txResponse = require('./txResponse');
const getTransactionByHash = require('./getTransactionByHash');

const PRIV1 =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';
const PRIV2 =
  '0xea3a59a673a9f7e74ad65e92ee04c2330fc5b905d0fa47bb2ae36c0b94af61cd';
const A1 = '0xB8205608d54cb81f44F263bE086027D8610F3C94';
const A2 = '0xD56F7dFCd2BaFfBC1d885F0266b21C7F2912020c';

describe('getTransactionByHash', () => {
  test('Non-existent tx', async () => {
    const db = {
      async getTransaction() {
        return null;
      },
    };

    expect(await getTransactionByHash(db, '0x00')).toBe(null);
  });

  test('Existent tx', async () => {
    const prevTx = Tx.transfer(
      [
        new Input(
          new Outpoint(
            '0x7777777777777777777777777777777777777777777777777777777777777777',
            0
          )
        ),
      ],
      [new Output(120, A1, 0)]
    ).signAll(PRIV1);
    const tx = Tx.transfer(
      [new Input(new Outpoint(prevTx.hash(), 0))],
      [new Output(100, A2, 0)]
    ).signAll(PRIV2);

    const data = {
      [tx.hash()]: {
        txData: tx.toJSON(),
        blockHash: '0x00',
        height: 0,
        txPos: 0,
      },
      [prevTx.hash()]: {
        txData: prevTx.toJSON(),
        blockHash: '0x00',
        height: 0,
        txPos: 0,
      },
    };
    const db = {
      async getTransaction(hash) {
        return data[hash];
      },
    };

    const response = await getTransactionByHash(db, tx.hash());
    expect(response).toEqual(await txResponse(db, tx, '0x00', 0, 0));
  });
});
