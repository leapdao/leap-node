const { Tx, Input, Outpoint, Output } = require('parsec-lib');
const accumulateTx = require('./accumulateTx');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';
const PRIV_1 =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';

test('accumulating tx in mempool', () => {
  const mempool = [];

  const prevTx =
    '0x7777777777777777777777777777777777777777777777777777777777777777';
  const value = 99000000;
  const color = 1337;
  const transfer = Tx.transfer(
    [new Input(new Outpoint(prevTx, 0))],
    [new Output(value, ADDR_1, color)]
  ).signAll(PRIV_1);
  const txs = [transfer, transfer, transfer];

  txs.forEach((tx, i) => {
    accumulateTx({ mempool }, tx);
    expect(mempool.length).toBe(i + 1);
    expect(mempool[i].hash).toBe(tx.hash());
  });
});
