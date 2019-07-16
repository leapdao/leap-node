const { Tx, Input, Outpoint, Output } = require('leap-core');
const getTransactionReceipt = require('./getTransactionReceipt');

const PRIV1 =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';
const PRIV2 =
  '0xea3a59a673a9f7e74ad65e92ee04c2330fc5b905d0fa47bb2ae36c0b94af61cd';
const A1 = '0xb8205608d54cb81f44f263be086027d8610f3c94';
const A2 = '0xD56F7dFCd2BaFfBC1d885F0266b21C7F2912020c';

describe('getTransactionReceipt', () => {
  test('Non-existent tx', async () => {
    const db = {
      async getTransaction() {
        return null;
      },
    };

    expect(await getTransactionReceipt(db, '0x00')).toBe(null);
  });

  test('Existing tx', async () => {
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
    ).signAll(PRIV2);
    const tx = Tx.transfer(
      [new Input(new Outpoint(prevTx.hash(), 0))],
      [new Output(100, A2, 0)]
    ).signAll(PRIV1);

    const data = {
      [tx.hash()]: {
        txData: tx.toJSON(),
        blockHash: '0x2',
        height: 2,
        txPos: 0,
      },
      [prevTx.hash()]: {
        txData: prevTx.toJSON(),
        blockHash: '0x1',
        height: 1,
        txPos: 0,
      },
    };
    const db = {
      async getTransaction(hash) {
        return data[hash];
      },
    };

    const response = await getTransactionReceipt(db, tx.hash());
    expect(response).toEqual({
      transactionHash: tx.hash(),
      transactionIndex: 0,
      blockHash: '0x2',
      blockNumber: '0x2',
      from: A1,
      to: A2,
      cumulativeGasUsed: '0x0',
      gasUsed: '0x0',
      contractAddress: null,
      logs: [],
      logsBloom: '0x',
      status: 1,
    });
  });
});
