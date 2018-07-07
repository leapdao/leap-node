const { Tx, Input, Outpoint, Output } = require('parsec-lib');

const applyTx = require('./applyTx');

const EMPTY_ADDR = '0x0000000000000000000000000000000000000000';
const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';
const PRIV_1 =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';
const ADDR_2 = '0x8ab21c65041778dfc7ec7995f9cdef3d5221a5ad';
const ADDR_3 = '0x418eaa171b93ed13589377cdbe6abf05840543af';
const PRIV_3 =
  '0x9ae3ed3d1659a33902644da4ce645cfac1de84bc0889909db83692c8374fc44e';

const getInitialState = () => ({
  txs: {},
  balances: {},
  unspent: {},
  processedDeposit: 11,
});

const makeBridgeWithDepositMock = (owner, amount, color) => {
  return {
    methods: {
      deposits: () => ({
        call: () => Promise.resolve({ owner, amount, color }),
      }),
    },
  };
};

const makeBridgeWithExitMock = (owner, amount, color) => {
  return {
    methods: {
      exits: () => ({ call: () => Promise.resolve({ owner, amount, color }) }),
    },
  };
};

const defaultDepositMock = makeBridgeWithDepositMock(ADDR_1, '500', 0);

async function shouldThrowAsync(fn, message) {
  let error;
  try {
    await fn();
  } catch (e) {
    error = e.message;
  }
  expect(error).toBe(message);
}

test('successful deposit tx', async () => {
  const state = getInitialState();
  const tx = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, tx, defaultDepositMock);
  expect(state.balances[0][ADDR_1]).toBe(500);
  const outpoint = new Outpoint(tx.hash(), 0);
  expect(state.unspent[outpoint.hex()]).toBeDefined();
  expect(state.processedDeposit).toBe(12);
});

test('successful deposit tx (non-default color)', async () => {
  const state = getInitialState();
  const tx = Tx.deposit(12, 500, ADDR_1, 1);
  await applyTx(state, tx, makeBridgeWithDepositMock(ADDR_1, '500', '1'));
  expect(state.balances[1][ADDR_1]).toBe(500);
  const outpoint = new Outpoint(tx.hash(), 0);
  expect(state.unspent[outpoint.hex()]).toBeDefined();
  expect(state.processedDeposit).toBe(12);
});

test('non-existent deposit', async () => {
  const state = getInitialState();
  const tx = Tx.deposit(12, 500, ADDR_1, 0);
  try {
    await applyTx(state, tx, makeBridgeWithDepositMock(EMPTY_ADDR, '0'));
  } catch (e) {
    expect(e.message).toBe('Trying to submit incorrect deposit');
  }
});

test('deposit skipping depositId', async () => {
  const state = getInitialState();
  const tx = Tx.deposit(13, 500, ADDR_1, 0);
  try {
    await applyTx(state, tx, defaultDepositMock);
  } catch (e) {
    expect(e.message).toBe('Deposit ID skipping ahead. want 12, found 13');
  }
});

test('deposit with wrong owner', async () => {
  const state = getInitialState();
  const tx = Tx.deposit(12, 500, ADDR_1, 0);
  try {
    await applyTx(state, tx, makeBridgeWithDepositMock(ADDR_2, '500', 0));
  } catch (e) {
    expect(e.message).toBe('Trying to submit incorrect deposit');
  }
});

test('deposit with wrong value', async () => {
  const state = getInitialState();
  const tx = Tx.deposit(12, 500, ADDR_1, 0);
  try {
    await applyTx(state, tx, makeBridgeWithDepositMock(ADDR_1, '600', 0));
  } catch (e) {
    expect(e.message).toBe('Trying to submit incorrect deposit');
  }
});

test('deposit with wrong color', async () => {
  const state = getInitialState();
  const tx = Tx.deposit(12, 500, ADDR_1, 0);
  try {
    await applyTx(state, tx, makeBridgeWithDepositMock(ADDR_1, '600', 1));
  } catch (e) {
    expect(e.message).toBe('Trying to submit incorrect deposit');
  }
});

test('prevent double deposit', async () => {
  const state = getInitialState();
  const tx = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, tx, defaultDepositMock);
  expect(state.balances[0][ADDR_1]).toBe(500);
  const outpoint = new Outpoint(tx.hash(), 0);
  expect(state.unspent[outpoint.hex()]).toBeDefined();
  try {
    await applyTx(state, tx, defaultDepositMock);
  } catch (e) {
    expect(e.message).toBe('Deposit ID already used.');
  }
});

test('prevent double deposit (spent)', async () => {
  const state = getInitialState();
  const deposit = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, deposit, defaultDepositMock);
  expect(state.balances[0][ADDR_1]).toBe(500);
  const outpoint = new Outpoint(deposit.hash(), 0);
  expect(state.unspent[outpoint.hex()]).toBeDefined();

  const transfer = Tx.transfer(
    [new Input(outpoint)],
    [new Output(500, ADDR_2, 0)]
  ).signAll(PRIV_1);
  await applyTx(state, transfer);
  expect(state.unspent[outpoint.hex()]).toBeUndefined();

  await shouldThrowAsync(async () => {
    await applyTx(state, deposit, defaultDepositMock);
  }, 'Deposit ID already used.');
});

test('successful exit tx', async () => {
  const state = getInitialState();
  const deposit = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, deposit, defaultDepositMock);
  expect(state.balances[0][ADDR_1]).toBe(500);
  const outpoint = new Outpoint(deposit.hash(), 0);
  expect(state.unspent[outpoint.hex()]).toBeDefined();

  const exit = Tx.exit(new Input(new Outpoint(deposit.hash(), 0)));
  await applyTx(state, exit, makeBridgeWithExitMock(ADDR_1, '500', 0));
  expect(state.balances[0][ADDR_1]).toBe(0);
  expect(state.unspent[outpoint.hex()]).toBeUndefined();
});

test('non-existent exit', async () => {
  const state = getInitialState();
  const deposit = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, deposit, defaultDepositMock);
  const exit = Tx.exit(new Input(new Outpoint(deposit.hash(), 0)));
  shouldThrowAsync(async () => {
    await applyTx(state, exit, makeBridgeWithExitMock(EMPTY_ADDR, '0'));
  }, 'Trying to submit incorrect exit');
});

test('exit with wrong amount', async () => {
  const state = getInitialState();
  const deposit = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, deposit, defaultDepositMock);
  const exit = Tx.exit(new Input(new Outpoint(deposit.hash(), 0)));
  shouldThrowAsync(async () => {
    await applyTx(state, exit, makeBridgeWithExitMock(ADDR_1, '600', 0));
  }, 'Trying to submit incorrect exit');
});

test('exit with wrong color', async () => {
  const state = getInitialState();
  const deposit = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, deposit, defaultDepositMock);
  const exit = Tx.exit(new Input(new Outpoint(deposit.hash(), 0)));
  shouldThrowAsync(async () => {
    await applyTx(state, exit, makeBridgeWithExitMock(ADDR_1, '500', 1));
  }, 'Trying to submit incorrect exit');
});

test('successful consolidate tx', async () => {
  const state = getInitialState();
  const deposit1 = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, deposit1, defaultDepositMock);
  expect(state.balances[0][ADDR_1]).toBe(500);
  const outpoint1 = new Outpoint(deposit1.hash(), 0);
  expect(state.unspent[outpoint1.hex()]).toBeDefined();
  const deposit2 = Tx.deposit(13, 500, ADDR_1, 0);
  await applyTx(state, deposit2, defaultDepositMock);
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
  await applyTx(state, consolidate);
  expect(state.balances[0][ADDR_1]).toBe(1000);
  expect(state.unspent[consolidate.inputs[0].prevout.hex()]).toBeUndefined();
  expect(state.unspent[consolidate.inputs[1].prevout.hex()]).toBeUndefined();
  const outpoint3 = new Outpoint(consolidate.hash(), 0);
  expect(state.unspent[outpoint3.hex()]).toBeDefined();
});

test('consolidate tx with 1 input', async () => {
  const state = getInitialState();
  const deposit = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, deposit, defaultDepositMock);
  shouldThrowAsync(async () => {
    await applyTx(
      state,
      Tx.consolidate(
        [new Input(new Outpoint(deposit.hash(), 0))],
        new Output(1000, ADDR_1, 0)
      )
    );
  }, 'Consolidate tx should have > 1 input');
});

test('consolidate tx with !== 1 output', async () => {
  const state = getInitialState();
  const deposit1 = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, deposit1, defaultDepositMock);
  const deposit2 = Tx.deposit(13, 500, ADDR_1, 0);
  await applyTx(state, deposit2, defaultDepositMock);
  const consolidate = Tx.consolidate(
    [
      new Input(new Outpoint(deposit1.hash(), 0)),
      new Input(new Outpoint(deposit2.hash(), 0)),
    ],
    new Output(1000, ADDR_1, 0)
  );
  consolidate.outputs.push(new Output(1000, ADDR_1, 0));
  await shouldThrowAsync(async () => {
    await applyTx(state, consolidate);
  }, 'Consolidate tx should have only 1 output');

  consolidate.outputs = [];
  await shouldThrowAsync(async () => {
    await applyTx(state, consolidate);
  }, 'Consolidate tx should have only 1 output');
});

test('successful transfer tx', async () => {
  const state = getInitialState();
  const deposit = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, deposit, defaultDepositMock);
  expect(state.balances[0][ADDR_1]).toBe(500);
  let outpoint = new Outpoint(deposit.hash(), 0);
  expect(state.unspent[outpoint.hex()]).toBeDefined();

  const transfer = Tx.transfer(
    [new Input(new Outpoint(deposit.hash(), 0))],
    [new Output(500, ADDR_2, 0)]
  ).signAll(PRIV_1);
  await applyTx(state, transfer);
  expect(state.balances[0][ADDR_1]).toBe(0);
  expect(state.balances[0][ADDR_2]).toBe(500);
  expect(state.unspent[transfer.inputs[0].prevout.hex()]).toBeUndefined();
  outpoint = new Outpoint(transfer.hash(), 0);
  expect(state.unspent[outpoint.hex()]).toBeDefined();
});

test('transfer tx with wrong color', async () => {
  const state = getInitialState();
  const deposit = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, deposit, defaultDepositMock);
  expect(state.balances[0][ADDR_1]).toBe(500);
  const outpoint = new Outpoint(deposit.hash(), 0);
  expect(state.unspent[outpoint.hex()]).toBeDefined();

  const transfer = Tx.transfer(
    [new Input(new Outpoint(deposit.hash(), 0))],
    [new Output(500, ADDR_2, 1)]
  ).signAll(PRIV_1);
  shouldThrowAsync(async () => {
    await applyTx(state, transfer);
  }, 'Ins and outs values are mismatch');
});

test('duplicate tx', async () => {
  const state = getInitialState();
  const tx = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, tx, defaultDepositMock);
  try {
    await applyTx(state, tx, defaultDepositMock);
  } catch (e) {
    expect(e.message).toBe('Deposit ID already used.');
  }
});

test('transfer tx with unowned output', async () => {
  const state = getInitialState();
  const deposit = Tx.deposit(12, 500, ADDR_2, 0);
  await applyTx(state, deposit, makeBridgeWithDepositMock(ADDR_2, '500', 0));
  expect(state.balances[0][ADDR_2]).toBe(500);
  const outpoint = new Outpoint(deposit.hash(), 0);
  expect(state.unspent[outpoint.hex()]).toBeDefined();

  const transfer = Tx.transfer(
    [new Input(new Outpoint(deposit.hash(), 0))],
    [new Output(500, ADDR_1, 0)]
  ).signAll(PRIV_1);
  try {
    await applyTx(state, transfer);
  } catch (e) {
    expect(e.message).toBe('Wrong inputs');
  }
});

test('transfer tx with non-existent output (1)', async () => {
  const state = getInitialState();
  const deposit = Tx.deposit(12, 500, ADDR_2, 0);

  const transfer = Tx.transfer(
    [new Input(new Outpoint(deposit.hash(), 0))],
    [new Output(500, ADDR_1, 0)]
  ).signAll(PRIV_1);
  try {
    await applyTx(state, transfer);
  } catch (e) {
    expect(e.message).toBe('Trying to spend non-existing output');
  }
});

test('transfer tx with non-existent output (2)', async () => {
  const state = getInitialState();
  const deposit = Tx.deposit(12, 500, ADDR_2, 0);

  const transfer = Tx.transfer(
    [new Input(new Outpoint(deposit.hash(), 1))],
    [new Output(500, ADDR_1, 0)]
  ).signAll(PRIV_1);
  try {
    await applyTx(state, transfer);
  } catch (e) {
    expect(e.message).toBe('Trying to spend non-existing output');
  }
});

test('transfer tx with several outputs', async () => {
  const state = getInitialState();

  const deposit = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, deposit, defaultDepositMock);

  const transfer = Tx.transfer(
    [new Input(new Outpoint(deposit.hash(), 0))],
    [new Output(300, ADDR_2, 0), new Output(200, ADDR_3, 0)]
  ).signAll(PRIV_1);
  await applyTx(state, transfer);
  expect(state.balances[0][ADDR_1]).toBe(0);
  expect(state.balances[0][ADDR_2]).toBe(300);
  expect(state.balances[0][ADDR_3]).toBe(200);

  const transfer2 = Tx.transfer(
    [new Input(new Outpoint(transfer.hash(), 1))],
    [new Output(100, ADDR_1, 0), new Output(100, ADDR_3, 0)]
  ).sign([PRIV_3]);
  await applyTx(state, transfer2);
  expect(state.balances[0][ADDR_1]).toBe(100);
  expect(state.balances[0][ADDR_3]).toBe(100);
});

test('transfer tx with several inputs', async () => {
  const state = getInitialState();

  const deposit = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, deposit, defaultDepositMock);
  const deposit2 = Tx.deposit(13, 500, ADDR_1, 0);
  await applyTx(state, deposit2, defaultDepositMock);
  expect(state.balances[0][ADDR_1]).toBe(1000);

  const transfer = Tx.transfer(
    [
      new Input(new Outpoint(deposit.hash(), 0)),
      new Input(new Outpoint(deposit2.hash(), 0)),
    ],
    [new Output(1000, ADDR_2, 0)]
  ).sign([PRIV_1, PRIV_1]);
  await applyTx(state, transfer);
  expect(state.balances[0][ADDR_1]).toBe(0);
  expect(state.balances[0][ADDR_2]).toBe(1000);
});

test('transfer tx with inputs/outputs mismatch', async () => {
  const state = getInitialState();

  const deposit = Tx.deposit(12, 500, ADDR_1, 0);
  await applyTx(state, deposit, defaultDepositMock);
  const deposit2 = Tx.deposit(13, 500, ADDR_1, 0);
  await applyTx(state, deposit2, defaultDepositMock);
  expect(state.balances[0][ADDR_1]).toBe(1000);

  const transfer = Tx.transfer(
    [
      new Input(new Outpoint(deposit.hash(), 0)),
      new Input(new Outpoint(deposit2.hash(), 0)),
    ],
    [new Output(1200, ADDR_2, 0)]
  ).sign([PRIV_1, PRIV_1]);
  try {
    await applyTx(state, transfer);
  } catch (e) {
    expect(e.message).toBe('Ins and outs values are mismatch');
  }
});
