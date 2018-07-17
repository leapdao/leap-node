const { Tx, Input, Outpoint, Output } = require('parsec-lib');

const applyTx = require('./index');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';
const PRIV_1 =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';
const ADDR_2 = '0x8ab21c65041778dfc7ec7995f9cdef3d5221a5ad';
const ADDR_3 = '0x418eaa171b93ed13589377cdbe6abf05840543af';
const PRIV_3 =
  '0x9ae3ed3d1659a33902644da4ce645cfac1de84bc0889909db83692c8374fc44e';
const TENDER_KEY_1 = '0x7640D69D9EDB21592CBDF4CC49956EA53E59656FC2D8BBD1AE3F427BF67D47FA'.toLowerCase();
const TENDER_KEY_2 = '0x0000069D9EDB21592CBDF4CC49956EA53E59656FC2D8BBD1AE3F427BF67D47FA'.toLowerCase();

const getInitialState = () => ({
  txs: {},
  balances: {},
  unspent: {},
  processedDeposit: 11,
  slots: [],
});

const makeDepositMock = (depositor, amount, color) => {
  return {
    deposits: new Proxy(
      {},
      {
        get: () => ({ depositor, amount, color }),
      }
    ),
  };
};

const makeExitMock = (exitor, amount, color) => {
  return {
    exits: new Proxy(
      {},
      {
        get: () => ({ exitor, amount, color }),
      }
    ),
  };
};

const defaultDepositMock = makeDepositMock(ADDR_1, '500', 0);

describe('Deposit', () => {
  test('successful tx', () => {
    const state = getInitialState();
    const tx = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, tx, defaultDepositMock);
    expect(state.balances[0][ADDR_1]).toBe(500);
    const outpoint = new Outpoint(tx.hash(), 0);
    expect(state.unspent[outpoint.hex()]).toBeDefined();
    expect(state.processedDeposit).toBe(12);
  });

  test('successful tx (non-default color)', () => {
    const state = getInitialState();
    const tx = Tx.deposit(12, 500, ADDR_1, 1);
    applyTx(state, tx, makeDepositMock(ADDR_1, '500', '1'));
    expect(state.balances[1][ADDR_1]).toBe(500);
    const outpoint = new Outpoint(tx.hash(), 0);
    expect(state.unspent[outpoint.hex()]).toBeDefined();
    expect(state.processedDeposit).toBe(12);
  });

  test('non-existent', () => {
    const state = getInitialState();
    const tx = Tx.deposit(12, 500, ADDR_1, 0);
    try {
      applyTx(state, tx, { deposits: {} });
    } catch (e) {
      expect(e.message).toBe('Trying to submit incorrect deposit');
    }
  });

  test('skipping depositId', () => {
    const state = getInitialState();
    const tx = Tx.deposit(13, 500, ADDR_1, 0);
    try {
      applyTx(state, tx, defaultDepositMock);
    } catch (e) {
      expect(e.message).toBe('Deposit ID skipping ahead. want 12, found 13');
    }
  });

  test('wrong owner', () => {
    const state = getInitialState();
    const tx = Tx.deposit(12, 500, ADDR_1, 0);
    try {
      applyTx(state, tx, makeDepositMock(ADDR_2, '500', 0));
    } catch (e) {
      expect(e.message).toBe('Trying to submit incorrect deposit');
    }
  });

  test('wrong value', () => {
    const state = getInitialState();
    const tx = Tx.deposit(12, 500, ADDR_1, 0);
    try {
      applyTx(state, tx, makeDepositMock(ADDR_1, '600', 0));
    } catch (e) {
      expect(e.message).toBe('Trying to submit incorrect deposit');
    }
  });

  test('wrong color', () => {
    const state = getInitialState();
    const tx = Tx.deposit(12, 500, ADDR_1, 0);
    try {
      applyTx(state, tx, makeDepositMock(ADDR_1, '600', 1));
    } catch (e) {
      expect(e.message).toBe('Trying to submit incorrect deposit');
    }
  });

  test('prevent double deposit', () => {
    const state = getInitialState();
    const tx = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, tx, defaultDepositMock);
    expect(state.balances[0][ADDR_1]).toBe(500);
    const outpoint = new Outpoint(tx.hash(), 0);
    expect(state.unspent[outpoint.hex()]).toBeDefined();
    try {
      applyTx(state, tx, defaultDepositMock);
    } catch (e) {
      expect(e.message).toBe('Deposit ID already used.');
    }
  });

  test('prevent double deposit (spent)', () => {
    const state = getInitialState();
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, deposit, defaultDepositMock);
    expect(state.balances[0][ADDR_1]).toBe(500);
    const outpoint = new Outpoint(deposit.hash(), 0);
    expect(state.unspent[outpoint.hex()]).toBeDefined();

    const transfer = Tx.transfer(
      [new Input(outpoint)],
      [new Output(500, ADDR_2, 0)]
    ).signAll(PRIV_1);
    applyTx(state, transfer);
    expect(state.unspent[outpoint.hex()]).toBeUndefined();

    expect(() => {
      applyTx(state, deposit, defaultDepositMock);
    }).toThrow('Deposit ID already used.');
  });

  test('duplicate tx', () => {
    const state = getInitialState();
    const tx = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, tx, defaultDepositMock);
    try {
      applyTx(state, tx, defaultDepositMock);
    } catch (e) {
      expect(e.message).toBe('Deposit ID already used.');
    }
  });
});

describe('Exit', () => {
  test('successful tx', () => {
    const state = getInitialState();
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, deposit, defaultDepositMock);
    expect(state.balances[0][ADDR_1]).toBe(500);
    const outpoint = new Outpoint(deposit.hash(), 0);
    expect(state.unspent[outpoint.hex()]).toBeDefined();

    const exit = Tx.exit(new Input(new Outpoint(deposit.hash(), 0)));
    applyTx(state, exit, makeExitMock(ADDR_1, '500', 0));
    expect(state.balances[0][ADDR_1]).toBe(0);
    expect(state.unspent[outpoint.hex()]).toBeUndefined();
  });

  test('non-existent', () => {
    const state = getInitialState();
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, deposit, defaultDepositMock);
    const exit = Tx.exit(new Input(new Outpoint(deposit.hash(), 0)));
    expect(() => {
      applyTx(state, exit, { exits: {} });
    }).toThrow('Trying to submit incorrect exit');
  });

  test('wrong amount', () => {
    const state = getInitialState();
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, deposit, defaultDepositMock);
    const exit = Tx.exit(new Input(new Outpoint(deposit.hash(), 0)));
    expect(() => {
      applyTx(state, exit, makeExitMock(ADDR_1, '600', 0));
    }).toThrow('Trying to submit incorrect exit');
  });

  test('wrong color', () => {
    const state = getInitialState();
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, deposit, defaultDepositMock);
    const exit = Tx.exit(new Input(new Outpoint(deposit.hash(), 0)));
    expect(() => {
      applyTx(state, exit, makeExitMock(ADDR_1, '500', 1));
    }).toThrow('Trying to submit incorrect exit');
  });
});

describe('Consolidate', () => {
  test('successful tx', () => {
    const state = getInitialState();
    const deposit1 = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, deposit1, defaultDepositMock);
    expect(state.balances[0][ADDR_1]).toBe(500);
    const outpoint1 = new Outpoint(deposit1.hash(), 0);
    expect(state.unspent[outpoint1.hex()]).toBeDefined();
    const deposit2 = Tx.deposit(13, 500, ADDR_1, 0);
    applyTx(state, deposit2, defaultDepositMock);
    expect(state.balances[0][ADDR_1]).toBe(1000);
    const outpoint2 = new Outpoint(deposit2.hash(), 0);
    expect(state.unspent[outpoint2.hex()]).toBeDefined();

    const consolidate = Tx.consolidate(
      [
        new Input(new Outpoint(deposit1.hash(), 0)),
        new Input(new Outpoint(deposit2.hash(), 0)),
      ],
      new Output(1000, ADDR_1, 0)
    );
    applyTx(state, consolidate);
    expect(state.balances[0][ADDR_1]).toBe(1000);
    expect(state.unspent[consolidate.inputs[0].prevout.hex()]).toBeUndefined();
    expect(state.unspent[consolidate.inputs[1].prevout.hex()]).toBeUndefined();
    const outpoint3 = new Outpoint(consolidate.hash(), 0);
    expect(state.unspent[outpoint3.hex()]).toBeDefined();
  });

  test('with 1 input', () => {
    const state = getInitialState();
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, deposit, defaultDepositMock);
    expect(() => {
      applyTx(
        state,
        Tx.consolidate(
          [new Input(new Outpoint(deposit.hash(), 0))],
          new Output(1000, ADDR_1, 0)
        )
      );
    }).toThrow('Consolidate tx should have > 1 input');
  });

  test('with !== 1 output', () => {
    const state = getInitialState();
    const deposit1 = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, deposit1, defaultDepositMock);
    const deposit2 = Tx.deposit(13, 500, ADDR_1, 0);
    applyTx(state, deposit2, defaultDepositMock);
    const consolidate = Tx.consolidate(
      [
        new Input(new Outpoint(deposit1.hash(), 0)),
        new Input(new Outpoint(deposit2.hash(), 0)),
      ],
      new Output(1000, ADDR_1, 0)
    );
    consolidate.outputs.push(new Output(1000, ADDR_1, 0));
    expect(() => {
      applyTx(state, consolidate);
    }).toThrow('Consolidate tx should have only 1 output');

    consolidate.outputs = [];
    expect(() => {
      applyTx(state, consolidate);
    }).toThrow('Consolidate tx should have only 1 output');
  });
});

describe('Transfer', () => {
  test('successful tx', () => {
    const state = getInitialState();
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, deposit, defaultDepositMock);
    expect(state.balances[0][ADDR_1]).toBe(500);
    let outpoint = new Outpoint(deposit.hash(), 0);
    expect(state.unspent[outpoint.hex()]).toBeDefined();

    const transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output(500, ADDR_2, 0)]
    ).signAll(PRIV_1);
    applyTx(state, transfer);
    expect(state.balances[0][ADDR_1]).toBe(0);
    expect(state.balances[0][ADDR_2]).toBe(500);
    expect(state.unspent[transfer.inputs[0].prevout.hex()]).toBeUndefined();
    outpoint = new Outpoint(transfer.hash(), 0);
    expect(state.unspent[outpoint.hex()]).toBeDefined();
  });

  test('successful tx with multiple colors', () => {
    const state = getInitialState();
    const deposit1 = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, deposit1, defaultDepositMock);
    expect(state.balances[0][ADDR_1]).toBe(500);
    const deposit2 = Tx.deposit(13, 500, ADDR_1, 1);
    applyTx(state, deposit2, makeDepositMock(ADDR_1, 500, 1));
    expect(state.balances[1][ADDR_1]).toBe(500);

    const transfer = Tx.transfer(
      [
        new Input(new Outpoint(deposit1.hash(), 0)),
        new Input(new Outpoint(deposit2.hash(), 0)),
      ],
      [new Output(500, ADDR_2, 0), new Output(500, ADDR_2, 1)]
    ).signAll(PRIV_1);
    applyTx(state, transfer);
    expect(state.balances[0][ADDR_1]).toBe(0);
    expect(state.balances[0][ADDR_2]).toBe(500);
    expect(state.balances[1][ADDR_1]).toBe(0);
    expect(state.balances[1][ADDR_2]).toBe(500);
  });

  test('wrong color', () => {
    const state = getInitialState();
    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, deposit, defaultDepositMock);
    expect(state.balances[0][ADDR_1]).toBe(500);
    const outpoint = new Outpoint(deposit.hash(), 0);
    expect(state.unspent[outpoint.hex()]).toBeDefined();

    const transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output(500, ADDR_2, 1)]
    ).signAll(PRIV_1);
    expect(() => {
      applyTx(state, transfer);
    }).toThrow('Ins and outs values are mismatch');
  });

  test('unowned output', () => {
    const state = getInitialState();
    const deposit = Tx.deposit(12, 500, ADDR_2, 0);
    applyTx(state, deposit, makeDepositMock(ADDR_2, '500', 0));
    expect(state.balances[0][ADDR_2]).toBe(500);
    const outpoint = new Outpoint(deposit.hash(), 0);
    expect(state.unspent[outpoint.hex()]).toBeDefined();

    const transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output(500, ADDR_1, 0)]
    ).signAll(PRIV_1);
    try {
      applyTx(state, transfer);
    } catch (e) {
      expect(e.message).toBe('Wrong inputs');
    }
  });

  test('non-existent output (1)', () => {
    const state = getInitialState();
    const deposit = Tx.deposit(12, 500, ADDR_2, 0);

    const transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output(500, ADDR_1, 0)]
    ).signAll(PRIV_1);
    try {
      applyTx(state, transfer);
    } catch (e) {
      expect(e.message).toBe('Trying to spend non-existing output');
    }
  });

  test('non-existent output (2)', () => {
    const state = getInitialState();
    const deposit = Tx.deposit(12, 500, ADDR_2, 0);

    const transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 1))],
      [new Output(500, ADDR_1, 0)]
    ).signAll(PRIV_1);
    try {
      applyTx(state, transfer);
    } catch (e) {
      expect(e.message).toBe('Trying to spend non-existing output');
    }
  });

  test('several outputs', () => {
    const state = getInitialState();

    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, deposit, defaultDepositMock);

    const transfer = Tx.transfer(
      [new Input(new Outpoint(deposit.hash(), 0))],
      [new Output(300, ADDR_2, 0), new Output(200, ADDR_3, 0)]
    ).signAll(PRIV_1);
    applyTx(state, transfer);
    expect(state.balances[0][ADDR_1]).toBe(0);
    expect(state.balances[0][ADDR_2]).toBe(300);
    expect(state.balances[0][ADDR_3]).toBe(200);

    const transfer2 = Tx.transfer(
      [new Input(new Outpoint(transfer.hash(), 1))],
      [new Output(100, ADDR_1, 0), new Output(100, ADDR_3, 0)]
    ).sign([PRIV_3]);
    applyTx(state, transfer2);
    expect(state.balances[0][ADDR_1]).toBe(100);
    expect(state.balances[0][ADDR_3]).toBe(100);
  });

  test('several inputs', () => {
    const state = getInitialState();

    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, deposit, defaultDepositMock);
    const deposit2 = Tx.deposit(13, 500, ADDR_1, 0);
    applyTx(state, deposit2, defaultDepositMock);
    expect(state.balances[0][ADDR_1]).toBe(1000);

    const transfer = Tx.transfer(
      [
        new Input(new Outpoint(deposit.hash(), 0)),
        new Input(new Outpoint(deposit2.hash(), 0)),
      ],
      [new Output(1000, ADDR_2, 0)]
    ).sign([PRIV_1, PRIV_1]);
    applyTx(state, transfer);
    expect(state.balances[0][ADDR_1]).toBe(0);
    expect(state.balances[0][ADDR_2]).toBe(1000);
  });

  test('inputs/outputs mismatch', () => {
    const state = getInitialState();

    const deposit = Tx.deposit(12, 500, ADDR_1, 0);
    applyTx(state, deposit, defaultDepositMock);
    const deposit2 = Tx.deposit(13, 500, ADDR_1, 0);
    applyTx(state, deposit2, defaultDepositMock);
    expect(state.balances[0][ADDR_1]).toBe(1000);

    const transfer = Tx.transfer(
      [
        new Input(new Outpoint(deposit.hash(), 0)),
        new Input(new Outpoint(deposit2.hash(), 0)),
      ],
      [new Output(1200, ADDR_2, 0)]
    ).sign([PRIV_1, PRIV_1]);
    try {
      applyTx(state, transfer);
    } catch (e) {
      expect(e.message).toBe('Ins and outs values are mismatch');
    }
  });
});

describe('Validators set updates', () => {
  test('successful validatorJoin tx (empty)', async () => {
    const state = getInitialState();

    const join = Tx.validatorJoin(0, TENDER_KEY_1, 1);
    await applyTx(state, join);

    expect(state.slots[0]).toBeDefined();
    expect(state.slots[0].eventsCount).toBe(1);
    expect(state.slots[0].tenderKey).toBe(TENDER_KEY_1);
  });

  test('successful validatorJoin tx (leaved)', async () => {
    const state = getInitialState();

    const join1 = Tx.validatorJoin(0, TENDER_KEY_1, 1);
    await applyTx(state, join1);

    const logout1 = Tx.validatorLogout(0, TENDER_KEY_1, 2, 1);
    await applyTx(state, logout1);

    const join2 = Tx.validatorJoin(0, TENDER_KEY_2, 3);
    await applyTx(state, join2);

    expect(state.slots[0]).toBeDefined();
    expect(state.slots[0].eventsCount).toBe(3);
    expect(state.slots[0].tenderKey).toBe(TENDER_KEY_2);
  });

  test('validatorJoin tx with wrong eventsCount (too big)', async () => {
    const state = getInitialState();

    const join1 = Tx.validatorJoin(0, TENDER_KEY_1, 1);
    await applyTx(state, join1);

    const logout1 = Tx.validatorLogout(0, TENDER_KEY_1, 2, 10);
    await applyTx(state, logout1);

    const join2 = Tx.validatorJoin(0, TENDER_KEY_2, 4);

    await shouldThrowAsync(async () => {
      await applyTx(state, join2);
    }, 'eventsCount expected to be x + 1');
  });

  test('validatorJoin tx with wrong eventsCount (too small)', async () => {
    const state = getInitialState();

    const join1 = Tx.validatorJoin(0, TENDER_KEY_1, 1);
    await applyTx(state, join1);

    const join2 = Tx.validatorJoin(0, TENDER_KEY_2, 2);
    await applyTx(state, join2);

    const join4 = Tx.validatorJoin(0, TENDER_KEY_2, 1);

    await shouldThrowAsync(async () => {
      await applyTx(state, join4);
    }, 'eventsCount expected to be x + 1');
  });

  test('validatorJoin tx with wrong eventsCount (!== 1)', async () => {
    const state = getInitialState();

    const join1 = Tx.validatorJoin(0, TENDER_KEY_1, 2);

    await shouldThrowAsync(async () => {
      await applyTx(state, join1);
    }, 'eventsCount should start from 1');
  });

  test('successful validatorLogout tx', async () => {
    const state = getInitialState();

    const join = Tx.validatorJoin(0, TENDER_KEY_1, 1);
    await applyTx(state, join);

    const logout = Tx.validatorLogout(0, TENDER_KEY_1, 2, 10);
    await applyTx(state, logout);

    expect(state.slots[0]).toBeDefined();
    expect(state.slots[0].eventsCount).toBe(2);
    expect(state.slots[0].tenderKey).toBe(TENDER_KEY_1);
    expect(state.slots[0].activationEpoch).toBe(10);
  });

  test('validatorLogout tx for empty slot', async () => {
    const state = getInitialState();

    const logout = Tx.validatorLogout(0, TENDER_KEY_1, 0, 10);
    await shouldThrowAsync(async () => {
      await applyTx(state, logout);
    }, 'Slot 0 is empty');
  });

  test('validatorLogout tx with different tenderAddr', async () => {
    const state = getInitialState();

    const logout = Tx.validatorLogout(0, TENDER_KEY_1, 0, 10);
    await shouldThrowAsync(async () => {
      await applyTx(state, logout);
    }, 'Slot 0 is empty');
  });
});
