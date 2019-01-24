const axios = require('axios');
const { Tx } = require('leap-core');
const sendRawTransaction = require('./sendRawTransaction');

const A1 = '0xB8205608d54cb81f44F263bE086027D8610F3C94';

jest.mock('axios');

describe('sendRawTransaction', () => {
  test('success', async () => {
    axios.post.mockImplementation(() => {
      return true;
    });
    const tx = Tx.deposit(0, 100, A1, 0);
    const response = await sendRawTransaction(0, tx.hex());
    expect(response).toBe(tx.hash());
  });
  test('error', async () => {
    const error = new Error();
    axios.post.mockImplementation(() => {
      throw error;
    });
    const tx = Tx.deposit(0, 100, A1, 0);
    try {
      await sendRawTransaction(0, tx.hex());
    } catch (err) {
      expect(err).toBe(error);
    }
  });
});
