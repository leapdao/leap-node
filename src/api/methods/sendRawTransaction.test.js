const { Tx } = require('leap-core');
const sendRawTransaction = require('./sendRawTransaction');

const A1 = '0xB8205608d54cb81f44F263bE086027D8610F3C94';

describe('sendRawTransaction', () => {
  test('success', async () => {
    const tx = Tx.deposit(0, 100, A1, 0);
    const response = await sendRawTransaction(0, { data: tx.toRaw() });
    expect(response).toBe(tx.hash());
  });
});
