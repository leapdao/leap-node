const getBlockByNumber = require('./getBlockByNumber');

jest.mock('./getBlockByHash');

const hashes = {
  0: '0x0',
  1: '0x1',
  2: '0x2',
};

const db = {
  async getBlock(height) {
    return hashes[height];
  },
};

describe('getBlockByNumber', () => {
  test('tag', async () => {
    const response = await getBlockByNumber({ blockHeight: 2 }, db, 'latest');
    expect(response).toEqual({ hash: hashes[2] });
  });

  test('decimal height', async () => {
    const response = await getBlockByNumber({}, db, 1);
    expect(response).toEqual({ hash: hashes[1] });
  });

  test('hex height', async () => {
    const response = await getBlockByNumber({}, db, '0x0');
    expect(response).toEqual({ hash: hashes[0] });
  });
});
