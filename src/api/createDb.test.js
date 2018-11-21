const { Tx, Block } = require('leap-core');
const createDb = require('./createDb');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';

describe('db', () => {
  test('getLastBlockSynced', async () => {
    let methodCalled = false;
    const level = {
      async get(key) {
        methodCalled = key === 'lastBlockSynced';
        if (!methodCalled) {
          throw new Error('lastBlockSynced key expected');
        }

        return 10;
      },
    };

    const db = createDb(level);
    expect(await db.getLastBlockSynced()).toBe(10);
    expect(methodCalled).toBe(true);
  });

  test('getLastBlockSynced: notFound', async () => {
    let methodCalled = false;
    const level = {
      async get(key) {
        methodCalled = key === 'lastBlockSynced';
        throw new Error('Error');
      },
    };

    const db = createDb(level);
    expect(await db.getLastBlockSynced()).toBe(0);
    expect(methodCalled).toBe(true);
  });

  test('getTransaction: null', async () => {
    let methodCalled = false;
    const txHash = '0x00001';
    const level = {
      async get(key) {
        methodCalled = key === `tx!${txHash}`;
        if (!methodCalled) {
          throw new Error('tx!$txHash key expected');
        }

        const err = new Error('NotFoundError');
        err.type = 'NotFoundError';
        throw err;
      },
    };

    const db = createDb(level);
    expect(await db.getTransaction(txHash)).toBe(null);
    expect(methodCalled).toBe(true);
  });

  test('getTransaction: exception', async () => {
    let methodCalled = false;
    const txHash = '0x00001';
    const level = {
      async get(key) {
        methodCalled = key === `tx!${txHash}`;
        if (!methodCalled) {
          throw new Error('tx!$txHash key expected');
        }

        const err = new Error('Random error');
        throw err;
      },
    };

    const db = createDb(level);
    let error;
    try {
      await db.getTransaction(txHash);
    } catch (err) {
      error = err;
    }
    expect(error.message).toBe('Random error');
  });

  test('getTransaction: document', async () => {
    let methodCalled = false;
    const txHash = '0x00001';
    const level = {
      async get(key) {
        methodCalled = key === `tx!${txHash}`;
        if (!methodCalled) {
          throw new Error('tx!$txHash key expected');
        }

        return JSON.stringify({
          hash: txHash,
          data: '0x001',
        });
      },
    };

    const db = createDb(level);
    expect(await db.getTransaction(txHash)).toEqual({
      hash: txHash,
      data: '0x001',
    });
    expect(methodCalled).toBe(true);
  });

  test('getBlock: number', async () => {
    let methodCalled = false;
    const number = 0;
    const level = {
      async get(key) {
        methodCalled = key === `block!${number}`;
        if (!methodCalled) {
          throw new Error('block!$hashOrNum key expected');
        }

        // return block hash
        return '0x0000000000000000000000';
      },
    };

    const db = createDb(level);
    expect(await db.getBlock(number)).toEqual('0x0000000000000000000000');
    expect(methodCalled).toBe(true);
  });

  test('storeBlock', async () => {
    const block = new Block(0);
    const deposit = Tx.deposit(0, 100, ADDR_1, 0);
    block.addTx(deposit);
    const calls = [];
    const level = {
      batch() {
        return {
          put(...args) {
            calls.push(args);
          },
          write(resolve) {
            setImmediate(resolve);
          },
        };
      },
    };

    const db = createDb(level);
    await db.storeBlock(block);
    expect(calls.length).toBe(4);
    expect(calls[0]).toEqual([
      `tx!${deposit.hash()}`,
      JSON.stringify({
        txData: deposit.toJSON(),
        blockHash: block.hash(),
        height: block.height,
        txPos: 0,
      }),
    ]);
    expect(calls[1]).toEqual([
      `block!${block.hash()}`,
      JSON.stringify({
        blockData: block.toJSON(),
        height: block.height,
      }),
    ]);
    expect(calls[2]).toEqual([`block!${block.height}`, block.hash()]);
    expect(calls[3]).toEqual(['lastBlockSynced', block.height]);
  });
});
