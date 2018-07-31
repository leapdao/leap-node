/* eslint-disable */

const axios = require('axios');
const test = require('tape-promise/tape');
const lotion = require('../index.js');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getState() {
  return axios.get('http://localhost:3000/state').then(res => res.data);
}

let app;

test('setup', async t => {
  // configure lotion app to test against
  const opts = {
    initialState: { txCount: 0, blockCount: 0, specialTxCount: 0 },
    devMode: true,
    logTendermint: false,
  };

  app = lotion(opts);
  function txHandler(state, tx, chainInfo) {
    if (tx.doNothing) {
      return;
    }
    state.txCount += 1;
    if (tx.shouldError === true) {
      throw new Error('this transaction should cause an error');
    }
    if (tx.isSpecial) {
      state.specialTxCount += 1;
    }
    if (tx.mutateDeep) {
      if (!state.accounts) {
        state.accounts = {};
        state.accounts.foo = {};
        state.accounts.foo.balance = 40;
      } else {
        state.accounts.foo.otherBalance = 60;
      }
    }
    if (tx.type === 'staking') {
      chainInfo.validators[tx.pubKey] = 1000;
    }
  }

  function blockHandler(state, chainInfo) {
    state.blockCount += 1;
    state.lastHeight = chainInfo.height - 1;
  }

  app.use(txHandler);
  app.useBlock(blockHandler);

  const { GCI } = await app.listen(3000);
  t.equal(typeof GCI, 'string');

  t.end();
});

test('get initial state', async t => {
  const state = await getState();

  t.equal(state.txCount, 0);
  t.end();
});

test('send a tx', async t => {
  const result = await axios
    .post('http://localhost:3000/txs', {})
    .then(res => res.data.result);

  t.equal(result.check_tx.code || 0, 0, 'no check_tx error code');
  t.equal(result.deliver_tx.code || 0, 0, 'no deliver_tx error code');

  // fetch state again
  const state = await getState();
  t.equal(state.txCount, 1, 'txCount should have incremented');
  t.end();
});

test('block handler should attach block height to state', async t => {
  await delay(3000);
  const state = await getState();
  t.ok(state.blockCount > 2);
  t.equal(state.blockCount, state.lastHeight);
  t.end();
});

test('tendermint node proxy', async t => {
  const result = await axios.get('http://localhost:3000/tendermint/status');
  t.equal(typeof result.data.result.node_info, 'object');
  t.end();
});

test('error handling', async t => {
  const result = await axios.post('http://localhost:3000/txs', {
    shouldError: true,
  });
  t.equal(result.data.result.check_tx.code, 2);
  t.equal(
    result.data.result.check_tx.log,
    'Error: this transaction should cause an error'
  );
  t.end();
});

test('deeply nested state mutations', async t => {
  await axios.post('http://localhost:3000/txs', {
    mutateDeep: true,
  });
  let state = await axios
    .get('http://localhost:3000/state')
    .then(res => res.data);
  t.equal(state.accounts.foo.balance, 40);
  t.equal(state.accounts.foo.otherBalance, undefined);
  await axios.post('http://localhost:3000/txs', {
    mutateDeep: true,
  });
  state = await axios.get('http://localhost:3000/state').then(res => res.data);
  t.equal(state.accounts.foo.otherBalance, 60);
  t.end();
});

test("tx that doesn't mutate state", async t => {
  const result = await axios.post('http://localhost:3000/txs', {
    doNothing: true,
  });
  const expectedErrorMessage = 'transaction must mutate state to be valid';
  t.equal(result.data.result.check_tx.code, 2);
  t.equal(result.data.result.check_tx.log, expectedErrorMessage);
});

test('node info endpoint', async t => {
  const result = await axios.get('http://localhost:3000/info');
  t.equal(Buffer.from(result.data.pubKey, 'base64').length, 37);
  t.end();
});

test('validator set changes', async t => {
  const result = await axios.get('http://localhost:3000/tendermint/validators');
  t.equal(result.data.result.validators[0].voting_power, 10);
  const pubKey = await axios
    .get('http://localhost:3000/info')
    .then(res => res.data.pubKey);
  await axios.post('http://localhost:3000/txs', {
    type: 'staking',
    pubKey,
  });
  await delay(3000);
  const result2 = await axios.get(
    'http://localhost:3000/tendermint/validators'
  );
  t.equal(result2.data.result.validators[0].voting_power, 1000);
});

test('cleanup', t => {
  app.close();
  t.end();
  process.exit();
});

process.on('unhandledRejection', reason => {
  console.log(reason);
});
