const { Tx, Period } = require('parsec-lib');
const addBlock = require('./addBlock');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';

test('addBlock', () => {
  const reward = Tx.coinbase(1, ADDR_1);
  const tx1 = Tx.coinbase(2, ADDR_1);
  const tx2 = Tx.coinbase(3, ADDR_1);
  const tx3 = Tx.coinbase(4, ADDR_1);
  const state = { mempool: [tx1, tx2, tx3] };
  const node = {
    currentPeriod: new Period(),
  };
  addBlock(state, { height: 1 }, { node, account: { address: ADDR_1 } });
  const { blockList } = node.currentPeriod;
  expect(blockList.length).toBe(1);
  const { txList } = blockList[0];
  expect(txList.length).toBe(4);
  expect(txList[0].hash()).toBe(reward.hash());
  expect(txList[1].hash()).toBe(tx1.hash());
  expect(txList[2].hash()).toBe(tx2.hash());
  expect(txList[3].hash()).toBe(tx3.hash());
  expect(state.mempool.length).toBe(0);
});
