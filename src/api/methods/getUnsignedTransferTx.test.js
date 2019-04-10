const { Tx, Input, Outpoint, Output } = require('leap-core');

const getUnsignedTransferTx = require('./getUnsignedTransferTx');

const PRIV1 =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';
const A1 = '0xB8205608d54cb81f44F263bE086027D8610F3C94';
const A2 = '0xD56F7dFCd2BaFfBC1d885F0266b21C7F2912020c';

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

const tx2 = Tx.transfer(
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
  [
    new Output(100, A2, 0),
    new Output(200, A1, 1),
    new Output(100, A1, 1),
    new Output(300, A2, 1),
  ]
).signAll(PRIV1);

const A1_LOWERCASE = A1.toLowerCase();
const state = {
  unspent: {
    [new Outpoint(tx1.hash(), 0).hex()]: tx1.outputs[0].toJSON(),
    [new Outpoint(tx1.hash(), 1).hex()]: tx1.outputs[1].toJSON(),
    [new Outpoint(tx1.hash(), 2).hex()]: tx1.outputs[2].toJSON(),
  },
  balances: {
    '0': { [A1_LOWERCASE]: 200 },
  },
};

const state2 = {
  unspent: {
    [new Outpoint(tx2.hash(), 0).hex()]: tx2.outputs[0].toJSON(),
    [new Outpoint(tx2.hash(), 1).hex()]: tx2.outputs[1].toJSON(),
    [new Outpoint(tx2.hash(), 2).hex()]: tx2.outputs[2].toJSON(),
    [new Outpoint(tx2.hash(), 3).hex()]: tx2.outputs[3].toJSON(),
  },
  balances: {
    '1': { [A1_LOWERCASE]: 300 },
  },
};

const fakedBridgeState = {
  currentState: state,
};
const fakedBridgeState2 = {
  currentState: state2,
};

describe('getUnsignedTransferTx', () => {
  test('Without enough unspent', async () => {
    let error;
    try {
      await getUnsignedTransferTx(fakedBridgeState, A1, A2, 5, 100);
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe('Insufficient balance');
  });

  test('Generate transfer transaction successfully', async () => {
    const expected = {
      type: 3,
      hash:
        '0x582a072f50b0cd47a028d09bb6d0e984a4ac12b281f96c82e796a35cdb252c43',
      inputs: [
        {
          hash: tx1.hash(),
          index: 1,
        },
      ],
      outputs: [
        {
          address: A2.toLowerCase(),
          value: '200',
          color: 0,
        },
      ],
    };

    const result = await getUnsignedTransferTx(
      fakedBridgeState,
      A1,
      A2,
      0,
      200
    );
    expect(result).toEqual(expected);
  });

  test('Need two inputs and generate two outputs', async () => {
    const expected = {
      type: 3,
      hash:
        '0xb31b4b333120c4d844c1b5bee0a74b4661f542120a067b756edeb4ebea23b80c',
      inputs: [
        {
          hash: tx2.hash(),
          index: 2,
        },
        {
          hash: tx2.hash(),
          index: 1,
        },
      ],
      outputs: [
        {
          address: A2.toLowerCase(),
          value: '260',
          color: 1,
        },
        {
          address: A1.toLowerCase(),
          value: '40',
          color: 1,
        },
      ],
    };

    const result = await getUnsignedTransferTx(
      fakedBridgeState2,
      A1,
      A2,
      1,
      260
    );
    expect(result).toEqual(expected);
  });
});
