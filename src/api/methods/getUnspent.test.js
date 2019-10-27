const { Tx, Input, Outpoint, Output } = require('leap-core');
const { merge } = require('lodash');
const getUnspent = require('./getUnspent');

const PRIV1 =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';
const A1 = '0xB8205608d54cb81f44F263bE086027D8610F3C94';
const A2 = '0xD56F7dFCd2BaFfBC1d885F0266b21C7F2912020c';

const TOKEN_ADDR = '0xb8205608d54cb81f44f263be086027d8610f3c94';

const tx = Tx.transfer(
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

const out0 = new Outpoint(tx.hash(), 0).hex();
const out1 = new Outpoint(tx.hash(), 1).hex();
const out2 = new Outpoint(tx.hash(), 2).hex();

const unspent = {
  [out0]: tx.outputs[0].toJSON(),
  [out1]: tx.outputs[1].toJSON(),
  [out2]: tx.outputs[2].toJSON(),
};

const bridgeState = extraState => merge({
  currentState: {
    unspent
  }
}, extraState);

describe('getUnspent', () => {
  test('unspent for existent addr', async () => {

    const unspent1 = await getUnspent(bridgeState(), A1);
    expect(unspent1).toEqual([
      {
        outpoint: out1,
        output: tx.outputs[1].toJSON(),
      },
    ]);

    const unspent2 = await getUnspent(bridgeState(), A2);
    expect(unspent2).toEqual([
      {
        outpoint: out0,
        output: tx.outputs[0].toJSON(),
      },
      {
        outpoint: out2,
        output: tx.outputs[2].toJSON(),
      },
    ]);
  });

  test('all unspent', async () => {
    const unspents = await getUnspent(bridgeState());
    expect(unspents).toEqual([
      {
        outpoint: out0,
        output: tx.outputs[0].toJSON(),
      },
      {
        outpoint: out1,
        output: tx.outputs[1].toJSON(),
      },
      {
        outpoint: out2,
        output: tx.outputs[2].toJSON(),
      },
    ]);
  });

  test('unspent for existent addr for specific color', async () => {
    const unspent1 = await getUnspent(bridgeState(), A1, 0);
    expect(unspent1).toEqual([
      {
        outpoint: out1,
        output: tx.outputs[1].toJSON(),
      },
    ]);

    const unspent2 = await getUnspent(bridgeState(), A1, '0');
    expect(unspent2).toEqual([
      {
        outpoint: out1,
        output: tx.outputs[1].toJSON(),
      },
    ]);
  });

  test('unspent for existent addr for specific token', async () => {
    const state = bridgeState({
      tokens: {
        erc20: [TOKEN_ADDR],
      },
    });

    const unspents = await getUnspent(state, A1, TOKEN_ADDR);
    expect(unspents).toEqual([
      {
        outpoint: out1,
        output: tx.outputs[1].toJSON(),
      },
    ]);
  });

  test('unspent for existent addr for non-existing token', async () => {
    const state = bridgeState({
      tokens: {
        erc20: [],
        erc721: [],
        erc1948: [],
      },
    });

    let error;
    try {
      await getUnspent(state, A1, TOKEN_ADDR);
    } catch (err) {
      error = err.message;
    }

    expect(error).toBe('Unknown token address');
  });

  test('empty unspent list', async () => {
    const state = bridgeState({
      currentState: {
        unspent: {},
      }
    });
    const unspents = await getUnspent(state, '0x000');
    expect(unspents).toEqual([]);
  });
});
