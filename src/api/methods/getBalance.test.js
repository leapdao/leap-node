const getBalance = require('./getBalance');

const ADDR = '0x4436373705394267350db2c06613990d34621d69';
const ADDR_2 = '0x4436373705394267350db2c06613990d34621d68';

const fakeBalance = (addr, color, balance) => ({
  currentState: {
    balances: {
      [color]: {
        [addr]: `${balance}`,
      },
    },
  },
});

describe('getBalance', () => {
  test('existent balance', async () => {
    const balance = 100;
    const result = await getBalance(fakeBalance(ADDR, 0, balance), ADDR);
    expect(result).toBe(`0x${balance.toString(16)}`);
  });

  test('non-existent balance', async () => {
    const result = await getBalance(fakeBalance(ADDR_2, 0, 100), ADDR);
    expect(result).toBe('0x0');
  });

  test('tag != latest', async () => {
    let error = null;
    try {
      await getBalance(fakeBalance(ADDR, 0, 100), ADDR, 'pending');
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe('Only balance for latest block is supported');
  });

  test('empty state', async () => {
    const balance = await getBalance(
      {
        currentState: {
          balances: {},
        },
      },
      ADDR
    );
    expect(balance).toBe('0x0');
  });
});
