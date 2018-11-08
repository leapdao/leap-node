const { Block, Tx } = require('leap-core');
const getBlockByHash = require('./getBlockByHash');
const txResponse = require('./txResponse');

const A1 = '0xB8205608d54cb81f44F263bE086027D8610F3C94';
const A2 = '0xD56F7dFCd2BaFfBC1d885F0266b21C7F2912020c';

const tx1 = Tx.deposit(1, 100, A1, 0);
const tx2 = Tx.deposit(2, 100, A2, 0);
const txs = {
  [tx1.hash()]: { txData: tx1.toJSON() },
  [tx2.hash()]: { txData: tx2.toJSON() },
};

const fakeDb = block => ({
  getBlock: async () =>
    block && {
      blockData: block.toJSON(),
      height: block.height,
    },
  getTransaction: async hash => txs[hash],
});

describe('getBlockByHash', () => {
  test('non-existent block', async () => {
    expect(await getBlockByHash(fakeDb(new Block(0)))).toBe(null);
    expect(await getBlockByHash(fakeDb(null), '0x000')).toBe(null);
  });

  test('without full transactions', async () => {
    const block = new Block(0, { timestamp: 0 });
    block.addTx(tx1).addTx(tx2);
    const response = await getBlockByHash(fakeDb(block), '0x00');
    expect(response).toEqual({
      number: '0x0',
      hash: block.hash(),
      parentHash: undefined,
      size: `0x${block.hex().length.toString(16)}`,
      timestamp: '0x0',
      transactions: [tx1.hash(), tx2.hash()],
      uncles: [],
    });
  });

  test('with full transactions', async () => {
    const block = new Block(0, { timestamp: 0 });
    block.addTx(tx1).addTx(tx2);
    const response = await getBlockByHash(fakeDb(block), '0x00', true);
    expect(response).toEqual({
      number: '0x0',
      hash: block.hash(),
      parentHash: undefined,
      size: `0x${block.hex().length.toString(16)}`,
      timestamp: '0x0',
      transactions: [
        await txResponse({}, tx1, block.hash(), block.height, 0),
        await txResponse({}, tx2, block.hash(), block.height, 1),
      ],
      uncles: [],
    });
  });
});
