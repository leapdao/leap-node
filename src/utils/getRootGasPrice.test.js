const axios = require('axios');
const getRootGasPrice = require('./getRootGasPrice');

jest.mock('axios');

axios.get.mockResolvedValue({
  data: {
    fast: 200.0,
    fastest: 2700.0,
    safeLow: 134.0,
    average: 180.0,
    block_time: 19.228571428571428,
    blockNum: 7269705,
    speed: 0.998286333650524,
    safeLowWait: 169.0,
    avgWait: 3.2,
    fastWait: 0.6,
    fastestWait: 0.6,
  },
});

const mockWeb3 = (networkId = 1) => ({
  eth: {
    net: {
      getId: () => networkId,
    },
  },
});

describe('getRootGasPrice', () => {
  describe('mainnet', () => {
    const web3 = mockWeb3();

    test('reads "fast" gas price by default from gas station API', async () => {
      const result = await getRootGasPrice(web3);
      expect(result).toBe(20000000000);
    });

    test('reads specified gas price from gas station API', async () => {
      const result = await getRootGasPrice(web3, 'safeLow');
      expect(result).toBe(13400000000);
    });

    test('reads specified gas price from gas station API', async () => {
      const result = await getRootGasPrice(web3, 'safeLowWait');
      expect(result).toBe(16900000000);
    });

    test('caps gas price to 200 gwei', async () => {
      const result = await getRootGasPrice(web3, 'fastest');
      expect(result).toBe(200000000000);
    });

    test('returns null if gas station is not available', async () => {
      axios.get.mockImplementationOnce(() =>
        Promise.reject(new Error('bad error'))
      );
      expect(getRootGasPrice(web3)).rejects.toEqual(
        new Error('Gas Station error')
      );
    });
  });

  test('returns null for non-mainnet networks', async () => {
    const rinkebyWeb3 = {
      eth: {
        net: {
          getId: () => 4,
        },
      },
    };
    const result = await getRootGasPrice(rinkebyWeb3);
    expect(result).toBeNull();
  });
});
