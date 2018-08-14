const { Tx, Period, Input, Outpoint, Output } = require('parsec-lib');
const addBlock = require('./addBlock');

const PRIV_1 =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';

test('addBlock', () => {
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
  };
  addBlock(state, { height: 1 }, { bridgeState });
  const { blockList } = bridgeState.currentPeriod;
  expect(blockList.length).toBe(1);
  const { txList } = blockList[0];
  expect(txList.length).toBe(3);
  expect(txList[0].hash()).toBe(tx1.hash());
  expect(txList[1].hash()).toBe(tx2.hash());
  expect(txList[2].hash()).toBe(tx3.hash());
  expect(state.mempool.length).toBe(0);
});
