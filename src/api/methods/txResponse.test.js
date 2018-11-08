const { Tx, Input, Outpoint, Output } = require('leap-core');
const txResponse = require('./txResponse');

const PRIV1 =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';
const PRIV2 =
  '0xea3a59a673a9f7e74ad65e92ee04c2330fc5b905d0fa47bb2ae36c0b94af61cd';
const A1 = '0xB8205608d54cb81f44F263bE086027D8610F3C94';
const A2 = '0xD56F7dFCd2BaFfBC1d885F0266b21C7F2912020c';

const fakeDb = tx => ({
  getTransaction: async () => ({ txData: tx.toJSON() }),
});

describe('txResponse', () => {
  test('transfer', async () => {
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
    const blockHash = '0x0';
    const height = 0;
    const txIndex = 0;
    const response = await txResponse(
      fakeDb(prevTx),
      tx,
      blockHash,
      height,
      txIndex
    );
    expect(response).toEqual({
      hash: tx.hash(),
      from: A1,
      to: A2,
      value: 100,
      color: 0,
      transactionIndex: txIndex,
      blockHash,
      blockNumber: `0x${height.toString(16)}`,
      raw: tx.hex(),
      gas: '0x0',
      gasPrice: '0x0',
    });
  });

  test('exit', async () => {
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
    const tx = Tx.exit(new Input(new Outpoint(prevTx.hash(), 0))).signAll(
      PRIV2
    );
    const blockHash = '0x0';
    const height = 0;
    const txIndex = 0;
    const response = await txResponse(
      fakeDb(prevTx),
      tx,
      blockHash,
      height,
      txIndex
    );
    expect(response).toEqual({
      hash: tx.hash(),
      from: A1,
      to: null,
      value: 120,
      color: 0,
      transactionIndex: txIndex,
      blockHash,
      blockNumber: `0x${height.toString(16)}`,
      raw: tx.hex(),
      gas: '0x0',
      gasPrice: '0x0',
    });
  });
});
