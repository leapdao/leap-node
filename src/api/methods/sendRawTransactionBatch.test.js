const { Tx } = require('leap-core');
const sendRawTransactionBatch = require('./sendRawTransactionBatch');

const A1 = '0xB8205608d54cb81f44F263bE086027D8610F3C94';

describe('sendRawTransactionBatch', () => {
  test('should return number of transactions', async () => {
    const txs = [Tx.deposit(0, 100, A1, 0)];
    const res = await sendRawTransactionBatch(0, txs);
    expect(res).toBe(txs.length);
  });
});
