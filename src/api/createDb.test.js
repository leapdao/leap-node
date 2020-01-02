const { Tx, Block, Input, Outpoint, Output } = require('leap-core');
const createDb = require('./createDb');

const ADDR_1 = '0xB8205608d54cb81f44F263bE086027D8610F3C94';
const PRIV =
  '0x9b63fe8147edb8d251a6a66fd18c0ed73873da9fff3f08ea202e1c0a8ead7311';

const levelBatch = {
  put: jest.fn(() => Promise.resolve()),
  write: resolve => setImmediate(resolve),
};

const levelMock = {
  put: jest.fn(() => Promise.resolve()),
  get: jest.fn(() => Promise.resolve()),
  batch() {
    return levelBatch;
  },
};

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
    const out1 = new Outpoint(
      '0x7777777777777777777777777777777777777777777777777777777777777777',
      0
    );

    const out2 = new Outpoint(
      '0x6666666666666666666666666666666666666666666666666666666666666666',
      1
    );
    const tx = Tx.transfer(
      [new Input(out1), new Input(out2)],
      [new Output(100, ADDR_1, 0)]
    ).signAll(PRIV);
    block.addTx(tx);
    let calls = [];
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
    expect(calls.length).toBe(6);
    expect(calls[0]).toEqual([
      `tx!${tx.hash()}`,
      JSON.stringify({
        txData: tx.toJSON(),
        blockHash: block.hash(),
        height: block.height,
        txPos: 0,
      }),
    ]);
    expect(calls[1]).toEqual([
      `out!0x7777777777777777777777777777777777777777777777777777777777777777:0`,
      `tx!${tx.hash()}`,
    ]);
    expect(calls[2]).toEqual([
      `out!0x6666666666666666666666666666666666666666666666666666666666666666:1`,
      `tx!${tx.hash()}`,
    ]);
    expect(calls[3]).toEqual([
      `block!${block.hash()}`,
      JSON.stringify({
        blockData: block.toJSON(),
        height: block.height,
      }),
    ]);
    expect(calls[4]).toEqual([`block!${block.height}`, block.hash()]);
    expect(calls[5]).toEqual(['lastBlockSynced', block.height]);

    // adding deposit should not add prevOut records
    calls = [];
    const deposit = Tx.deposit(1, 100, ADDR_1, 0);
    const block1 = new Block(1);
    block1.addTx(deposit);
    await db.storeBlock(block1);
    expect(calls.length).toBe(4);
  });

  test('getTransactionByPrevOut', async () => {
    let methodCalled = false;
    const prevTxHash =
      '0x6666666666666666666666666666666666666666666666666666666666666666';
    const outIndex = 1;
    const utxo = `${prevTxHash}:${outIndex}`;
    const tx = Tx.transfer(
      [new Input(new Outpoint(prevTxHash, outIndex))],
      [new Output(100, ADDR_1, 0)]
    ).signAll(PRIV);

    let callCount = 0;
    const level = {
      async get(key) {
        methodCalled = true;
        callCount += 1;

        if (callCount === 1 && key === `out!${utxo}`) {
          // return tx hash
          return `tx!${tx.hash()}`;
        }

        if (callCount === 2 && key === `tx!${tx.hash()}`) {
          return JSON.stringify({
            txData: tx.toJSON(),
            blockHash: '0x3447',
            height: 2,
            txPos: 0,
          });
        }

        methodCalled = false;
        throw new Error('no call or unexpected call:', key);
      },
    };

    const db = createDb(level);
    expect(await db.getTransactionByPrevOut(utxo)).toEqual({
      txData: tx.toJSON(),
      blockHash: '0x3447',
      height: 2,
      txPos: 0,
    });
    expect(methodCalled).toBe(true);
  });

  describe('#storePeriods', () => {
    const submission1 = {
      periodStart: 32,
      casBitmap: '0x123',
      slotId: 1,
      validatorAddress: ADDR_1,
    };

    const submission2 = {
      periodStart: 64,
      casBitmap: '0x456',
      slotId: 2,
      validatorAddress: ADDR_1,
    };

    test('single submission per period', async () => {
      levelMock.get = jest.fn().mockRejectedValue({ type: 'NotFoundError' });
      const db = createDb(levelMock);

      await db.storePeriods([submission1, submission2]);

      expect(levelMock.batch().put).toHaveBeenNthCalledWith(
        1,
        'period!32',
        JSON.stringify([submission1])
      );
      expect(levelMock.batch().put).toHaveBeenNthCalledWith(
        2,
        'period!64',
        JSON.stringify([submission2])
      );
    });

    test('multiple submissions per period', async () => {
      const samePeriodHeightSubmission = {
        periodStart: 32,
        casBitmap: '0x456',
        slotId: 2,
        validatorAddress: ADDR_1,
      };
      levelMock.get = jest.fn().mockResolvedValue([submission1]);
      const db = createDb(levelMock);

      await db.storePeriods([samePeriodHeightSubmission]);

      expect(levelMock.batch().put).toHaveBeenCalledWith(
        'period!32',
        JSON.stringify([submission1, samePeriodHeightSubmission])
      );
    });
  });

  describe('nodeState', () => {
    test('store', async () => {
      const state = { someState: { state: 1 } };
      const db = createDb(levelMock);

      await db.storeNodeState(state);

      expect(levelMock.put).toHaveBeenCalledWith(
        'nodeState',
        JSON.stringify(state)
      );
    });

    test('read', async () => {
      const db = createDb(levelMock);

      await db.getNodeState();

      expect(levelMock.get).toHaveBeenCalledWith('nodeState');
    });
  });
});
