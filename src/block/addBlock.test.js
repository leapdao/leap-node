const { Tx, Period, Input, Outpoint, Output } = require('leap-core');
const addBlock = require('./addBlock');

const PRIV_1 =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';
const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';

test('addBlock', async () => {
  const tx1 = Tx.transfer(
    [
      new Input(
        new Outpoint(
          '0x7777777777777777777777777777777777777777777777777777777777777777',
          0
        )
      ),
    ],
    [new Output(99000000, ADDR_1, 1337)]
  ).signAll(PRIV_1);
  const tx2 = Tx.transfer(
    [
      new Input(
        new Outpoint(
          '0x7777777777777777777777777777777777777777777777777777777777777777',
          0
        )
      ),
    ],
    [new Output(99000001, ADDR_1, 1337)]
  ).signAll(PRIV_1);
  const tx3 = Tx.transfer(
    [
      new Input(
        new Outpoint(
          '0x7777777777777777777777777777777777777777777777777777777777777777',
          0
        )
      ),
    ],
    [new Output(99000002, ADDR_1, 1337)]
  ).signAll(PRIV_1);

  const state = { mempool: [tx1.toJSON(), tx2.toJSON(), tx3.toJSON()] };
  const bridgeState = {
    currentPeriod: new Period(),
    account: { address: ADDR_1 },
    lastBlockSynced: 0,
  };
  let blockSaved = false;
  await addBlock(
    state,
    { height: 1 },
    {
      bridgeState,
      db: {
        storeBlock: async () => {
          blockSaved = true;
        },
      },
    }
  );
  const { blockList } = bridgeState.currentPeriod;
  expect(blockList.length).toBe(1);
  const { txList } = blockList[0];
  expect(txList.length).toBe(3);
  expect(txList[0].hash()).toBe(tx1.hash());
  expect(txList[1].hash()).toBe(tx2.hash());
  expect(txList[2].hash()).toBe(tx3.hash());
  expect(state.mempool.length).toBe(0);
  expect(bridgeState.lastBlockSynced).toBe(1);
  expect(blockSaved).toBe(true);
});

test('addBlock: replay', async () => {
  const tx1 = Tx.transfer(
    [
      new Input(
        new Outpoint(
          '0x7777777777777777777777777777777777777777777777777777777777777777',
          0
        )
      ),
    ],
    [new Output(99000000, ADDR_1, 1337)]
  ).signAll(PRIV_1);
  const tx2 = Tx.transfer(
    [
      new Input(
        new Outpoint(
          '0x7777777777777777777777777777777777777777777777777777777777777777',
          0
        )
      ),
    ],
    [new Output(99000001, ADDR_1, 1337)]
  ).signAll(PRIV_1);
  const tx3 = Tx.transfer(
    [
      new Input(
        new Outpoint(
          '0x7777777777777777777777777777777777777777777777777777777777777777',
          0
        )
      ),
    ],
    [new Output(99000002, ADDR_1, 1337)]
  ).signAll(PRIV_1);

  const state = { mempool: [tx1.toJSON(), tx2.toJSON(), tx3.toJSON()] };
  const bridgeState = {
    currentPeriod: new Period(),
    account: { address: ADDR_1 },
    lastBlockSynced: 10,
  };
  let blockSaved = false;
  await addBlock(
    state,
    { height: 1 },
    {
      bridgeState,
      db: {
        storeBlock: async () => {
          blockSaved = true;
        },
      },
    }
  );
  expect(blockSaved).toBe(false);
});
