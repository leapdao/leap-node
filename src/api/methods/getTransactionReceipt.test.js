const { Tx, Input, Outpoint, Output } = require('leap-core');
const getTransactionReceipt = require('./getTransactionReceipt');

const PRIV1 =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';
const PRIV2 =
  '0xea3a59a673a9f7e74ad65e92ee04c2330fc5b905d0fa47bb2ae36c0b94af61cd';
const A1 = '0xb8205608d54cb81f44f263be086027d8610f3c94';
const A2 = '0xD56F7dFCd2BaFfBC1d885F0266b21C7F2912020c';

const logs = [
  [
    {
      type: 'Buffer',
      data: [
        51,
        248,
        254,
        229,
        79,
        40,
        116,
        241,
        121,
        50,
        128,
        187,
        189,
        129,
        226,
        154,
        91,
        67,
        3,
        250,
      ],
    },
    [
      {
        type: 'Buffer',
        data: [
          221,
          242,
          82,
          173,
          27,
          226,
          200,
          155,
          105,
          194,
          176,
          104,
          252,
          55,
          141,
          170,
          149,
          43,
          167,
          241,
          99,
          196,
          161,
          22,
          40,
          245,
          90,
          77,
          245,
          35,
          179,
          239,
        ],
      },
      {
        type: 'Buffer',
        data: [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          237,
          35,
          6,
          233,
          177,
          2,
          138,
          237,
          138,
          227,
          43,
          94,
          185,
          84,
          93,
          176,
          77,
          244,
          158,
          35,
        ],
      },
      {
        type: 'Buffer',
        data: [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          137,
          195,
          104,
          201,
          191,
          241,
          203,
          94,
          55,
          78,
          118,
          222,
          60,
          91,
          116,
          77,
          188,
          29,
          35,
          252,
        ],
      },
    ],
    {
      type: 'Buffer',
      data: [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        5,
        245,
        225,
        0,
      ],
    },
  ],
];

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
        logs,
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
      raw: tx.hex(),
      cumulativeGasUsed: '0x0',
      gasUsed: '0x0',
      contractAddress: null,
      logs: [
        {
          transactionLogIndex: 0,
          transactionIndex: 0,
          blockNumber: '0x2',
          transactionHash: tx.hash(),
          address: '0x33f8fee54f2874f1793280bbbd81e29a5b4303fa',
          topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            '0x000000000000000000000000ed2306e9b1028aed8ae32b5eb9545db04df49e23',
            '0x00000000000000000000000089c368c9bff1cb5e374e76de3c5b744dbc1d23fc',
          ],
          data:
            '0x0000000000000000000000000000000000000000000000000000000005f5e100',
          logIndex: 0,
          blockHash: '0x2',
        },
      ],
      logsBloom: '0x',
      status: '0x1',
    });
  });
});
