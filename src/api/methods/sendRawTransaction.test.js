const axios = require('axios');
const { Tx } = require('leap-core');
const sendRawTransaction = require('./sendRawTransaction');

const A1 = '0xB8205608d54cb81f44F263bE086027D8610F3C94';

jest.mock('axios');

axios.get.mockResolvedValue({
  data: {
    result: {
      check_tx: {},
      deliver_tx: {},
      hash: '51E85B8E40E1916545A7725FC5DE1F35ADDCBE7C0723E7457F99D80239BDF79C',
      height: '74',
    },
  },
});

describe('sendRawTransaction', () => {
  test('success with hex', async () => {
    const tx = Tx.deposit(0, 100, A1, 0);
    const response = await sendRawTransaction(0, tx.hex());
    expect(response.hash).toBe(tx.hash());
  });

  test('success with buffer', async () => {
    const tx = Tx.deposit(0, 100, A1, 0);
    const response = await sendRawTransaction(0, tx.toRaw());
    expect(response.hash).toBe(tx.hash());
  });

  test('error', async () => {
    const error = new Error();
    axios.get.mockImplementation(() => {
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
