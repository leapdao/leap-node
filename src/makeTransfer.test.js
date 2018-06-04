const { Tx, Outpoint } = require('parsec-lib');
const ethUtil = require('ethereumjs-util');

const makeTransfer = require('./makeTransfer');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';
const PRIV_1 =
  '0xad8e31c8862f5f86459e7cca97ac9302c5e1817077902540779eef66e21f394a';
const ADDR_2 = '0x8ab21c65041778dfc7ec7995f9cdef3d5221a5ad';

const deposit1 = Tx.deposit(1, 100, ADDR_1);
const deposit2 = Tx.deposit(2, 200, ADDR_1);
const client = {
  state: {
    balances: {
      [ADDR_1]: Promise.resolve(300),
    },
    unspent: Promise.resolve({
      [new Outpoint(deposit1.hash(), 0).hex()]: deposit1.outputs[0],
      [new Outpoint(deposit2.hash(), 0).hex()]: deposit2.outputs[0],
    }),
  },
};

test('insufficient funds', async () => {
  try {
    await makeTransfer(client, ADDR_1, ADDR_2, 400);
  } catch (e) {
    expect(e.message).toBe('Insufficient balance');
  }
});

test('transfer tx with exact inputs amount', async () => {
  const transfer1 = await makeTransfer(client, ADDR_1, ADDR_2, 100);
  expect(transfer1.inputs.length).toBe(1);
  expect(transfer1.outputs.length).toBe(1);
  expect(ethUtil.bufferToHex(transfer1.inputs[0].prevout.hash)).toBe(
    deposit1.hash()
  );
  expect(transfer1.inputs[0].prevout.index).toBe(0);
  expect(transfer1.outputs[0].address).toBe(ADDR_2);
  expect(transfer1.outputs[0].value).toBe(100);

  const transfer2 = await makeTransfer(client, ADDR_1, ADDR_2, 300);
  expect(transfer2.inputs.length).toBe(2);
  expect(transfer2.outputs.length).toBe(1);
  expect(ethUtil.bufferToHex(transfer1.inputs[0].prevout.hash)).toBe(
    deposit1.hash()
  );
  expect(transfer2.inputs[0].prevout.index).toBe(0);
  expect(ethUtil.bufferToHex(transfer2.inputs[1].prevout.hash)).toBe(
    deposit2.hash()
  );
  expect(transfer2.inputs[1].prevout.index).toBe(0);
  expect(transfer2.outputs[0].address).toBe(ADDR_2);
  expect(transfer2.outputs[0].value).toBe(300);
});

test('transfer tx with remains', async () => {
  const transfer1 = await makeTransfer(client, ADDR_1, ADDR_2, 50);
  expect(transfer1.inputs.length).toBe(1);
  expect(transfer1.outputs.length).toBe(2);
  expect(transfer1.outputs[0].address).toBe(ADDR_2);
  expect(transfer1.outputs[0].value).toBe(50);
  expect(transfer1.outputs[1].address).toBe(ADDR_1);
  expect(transfer1.outputs[1].value).toBe(50);

  const transfer2 = await makeTransfer(client, ADDR_1, ADDR_2, 150);
  expect(transfer2.inputs.length).toBe(2);
  expect(transfer2.outputs.length).toBe(2);
  expect(transfer2.outputs[0].address).toBe(ADDR_2);
  expect(transfer2.outputs[0].value).toBe(150);
  expect(transfer2.outputs[1].address).toBe(ADDR_1);
  expect(transfer2.outputs[1].value).toBe(150);
});

test('signed transfer tx', async () => {
  const transfer = await makeTransfer(client, ADDR_1, ADDR_2, 100, {
    privKey: PRIV_1,
  });
  expect(transfer.inputs.length).toBe(1);
  expect(transfer.inputs[0].signer).toBe(ADDR_1);
});

test('tx height', async () => {
  const transfer = await makeTransfer(client, ADDR_1, ADDR_2, 100, {
    height: 100,
  });
  expect(transfer.options.height).toBe(100);
});
