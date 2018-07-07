const { Tx } = require('parsec-lib');
const accumulateTx = require('./accumulateTx');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';

test('accumulating tx in mempool', () => {
  const mempool = [];

  const txs = [
    Tx.coinbase(1, ADDR_1),
    Tx.coinbase(1, ADDR_1),
    Tx.coinbase(1, ADDR_1),
  ];

  txs.forEach((tx, i) => {
    accumulateTx({ mempool }, tx);
    expect(mempool.length).toBe(i + 1);
    expect(mempool[i].hash).toBe(tx.hash());
  });
});
