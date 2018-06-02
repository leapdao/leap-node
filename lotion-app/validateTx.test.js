const { Tx, Input, Outpoint, Output } = require('parsec-lib');

const validateTx = require('./validateTx');

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
});

test('successful deposit tx', async () => {
  const state = getInitialState();
  const tx = Tx.deposit(12, 500, ADDR_1);
  await validateTx(state, { encoded: tx.hex() });
  expect(state.balances[ADDR_1]).toBe(500);
  const outpoint = new Outpoint(tx.hash(), 0);
  expect(state.unspent[outpoint.hex()]).toBeDefined();
});

test('successful transfer tx', async () => {
  const state = getInitialState();
  const deposit = Tx.deposit(12, 500, ADDR_1);
  await validateTx(state, { encoded: deposit.hex() });
  expect(state.balances[ADDR_1]).toBe(500);
  let outpoint = new Outpoint(deposit.hash(), 0);
  expect(state.unspent[outpoint.hex()]).toBeDefined();

  const transfer = Tx.transfer(
    0,
    [new Input(new Outpoint(deposit.hash(), 0))],
    [new Output(500, ADDR_2)]
  ).sign([PRIV_1]);
  await validateTx(state, { encoded: transfer.hex() });
  expect(state.balances[ADDR_1]).toBe(0);
  expect(state.balances[ADDR_2]).toBe(500);
  expect(state.unspent[transfer.inputs[0].prevout.hex()]).toBeNull();
  outpoint = new Outpoint(transfer.hash(), 0);
  expect(state.unspent[outpoint.hex()]).toBeDefined();
});

test('duplicate tx', async () => {
  const state = getInitialState();
  const tx = Tx.deposit(12, 500, ADDR_1);
  await validateTx(state, { encoded: tx.hex() });
  try {
    await validateTx(state, { encoded: tx.hex() });
  } catch (e) {
    expect(e.message).toBe('Tx already submitted');
  }
});

test('transfer tx with unowned output', async () => {
  const state = getInitialState();
  const deposit = Tx.deposit(12, 500, ADDR_2);
  await validateTx(state, { encoded: deposit.hex() });
  expect(state.balances[ADDR_2]).toBe(500);
  const outpoint = new Outpoint(deposit.hash(), 0);
  expect(state.unspent[outpoint.hex()]).toBeDefined();

  const transfer = Tx.transfer(
    0,
    [new Input(new Outpoint(deposit.hash(), 0))],
    [new Output(500, ADDR_1)]
  ).sign([PRIV_1]);
  try {
    await validateTx(state, { encoded: transfer.hex() });
  } catch (e) {
    expect(e.message).toBe('Wrong inputs');
  }
});

test('transfer tx with non-existent output  (1)', async () => {
  const state = getInitialState();
  const deposit = Tx.deposit(12, 500, ADDR_2);

  const transfer = Tx.transfer(
    0,
    [new Input(new Outpoint(deposit.hash(), 0))],
    [new Output(500, ADDR_1)]
  ).sign([PRIV_1]);
  try {
    await validateTx(state, { encoded: transfer.hex() });
  } catch (e) {
    expect(e.message).toBe('trying to spend non-existing output');
  }
});

test('transfer tx with non-existent output (2)', async () => {
  const state = getInitialState();
  const deposit = Tx.deposit(12, 500, ADDR_2);

  const transfer = Tx.transfer(
    0,
    [new Input(new Outpoint(deposit.hash(), 1))],
    [new Output(500, ADDR_1)]
  ).sign([PRIV_1]);
  try {
    await validateTx(state, { encoded: transfer.hex() });
  } catch (e) {
    expect(e.message).toBe('trying to spend non-existing output');
  }
});

test('transfer tx with several outputs', async () => {
  const state = getInitialState();

  const deposit = Tx.deposit(12, 500, ADDR_1);
  await validateTx(state, { encoded: deposit.hex() });

  const transfer = Tx.transfer(
    0,
    [new Input(new Outpoint(deposit.hash(), 0))],
    [new Output(300, ADDR_2), new Output(200, ADDR_3)]
  ).sign([PRIV_1]);
  await validateTx(state, { encoded: transfer.hex() });
  expect(state.balances[ADDR_1]).toBe(0);
  expect(state.balances[ADDR_2]).toBe(300);
  expect(state.balances[ADDR_3]).toBe(200);

  const transfer2 = Tx.transfer(
    0,
    [new Input(new Outpoint(transfer.hash(), 1))],
    [new Output(100, ADDR_1), new Output(100, ADDR_3)]
  ).sign([PRIV_3]);
  await validateTx(state, { encoded: transfer2.hex() });
  expect(state.balances[ADDR_1]).toBe(100);
  expect(state.balances[ADDR_3]).toBe(100);
});

test('transfer tx with several inputs', async () => {
  const state = getInitialState();

  const deposit = Tx.deposit(12, 500, ADDR_1);
  await validateTx(state, { encoded: deposit.hex() });
  const deposit2 = Tx.deposit(13, 500, ADDR_1);
  await validateTx(state, { encoded: deposit2.hex() });
  expect(state.balances[ADDR_1]).toBe(1000);

  const transfer = Tx.transfer(
    0,
    [
      new Input(new Outpoint(deposit.hash(), 0)),
      new Input(new Outpoint(deposit2.hash(), 0)),
    ],
    [new Output(1000, ADDR_2)]
  ).sign([PRIV_1, PRIV_1]);
  await validateTx(state, { encoded: transfer.hex() });
  expect(state.balances[ADDR_1]).toBe(0);
  expect(state.balances[ADDR_2]).toBe(1000);
});

test('transfer tx with inputs/outputs mismatch', async () => {
  const state = getInitialState();

  const deposit = Tx.deposit(12, 500, ADDR_1);
  await validateTx(state, { encoded: deposit.hex() });
  const deposit2 = Tx.deposit(13, 500, ADDR_1);
  await validateTx(state, { encoded: deposit2.hex() });
  expect(state.balances[ADDR_1]).toBe(1000);

  const transfer = Tx.transfer(
    0,
    [
      new Input(new Outpoint(deposit.hash(), 0)),
      new Input(new Outpoint(deposit2.hash(), 0)),
    ],
    [new Output(1200, ADDR_2)]
  ).sign([PRIV_1, PRIV_1]);
  try {
    await validateTx(state, { encoded: transfer.hex() });
  } catch (e) {
    expect(e.message).toBe('Ins and outs values are mismatch');
  }
});
