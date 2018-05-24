const lotion = require('lotion');
const { Tx, Type } = require('parsec-lib');

// const bridgeAddr = '0xa0a368325920b028e4da0ee2d7ccd8468b7ad1ee';

const app = lotion({
  initialState: {
    txHashes: [], // prevents tx resubmit
    balances: {}, // stores account balances
    unspent: {}, // stores txs with unspent outputs (deposits, transfers)
  },
  // target: 'tcp://localhost:46657',
  abciPort: 46658,
});

const sumOuts = (value, out) => value + out.value;
const sumTxsOuts = (value, tx) => tx.outs.reduce(sumOuts, value);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Patched lotion with support of async handler needed here
// https://github.com/parsec-labs/js-abci/commit/0d8ac8467b0e764b8b6f2c6f732501dc386dfcfc#diff-28f410b2e519d66e906cae6f42bcf5d8R12
app.useTx(async (state, { encoded: rawTx }, chainInfo) => {
  console.log(chainInfo);
  await delay(2000);
  const tx = Tx.parse(rawTx);
  if (tx.type !== Type.DEPOSIT && tx.type !== Type.TRANSFER) {
    throw new Error('Unsupported tx type. Only deposits and transfers');
  }

  if (state.txHashes.indexOf(tx.hash) > -1) {
    throw new Error('Tx already submitted');
  }

  if (tx.type === Type.DEPOSIT) {
    // check deposit from contract here
    const [{ addr, value }] = tx.outs;
    state.balances[addr] = (state.balances[addr] || 0) + value;
    state.unspent[tx.hash] = tx;
  }

  if (tx.type === Type.TRANSFER) {
    const unspents = tx.ins.map(ins => state.unspents[ins.prevTx]);
    // ToDo: need to check ownership
    if (unspents.length !== tx.ins.length) {
      throw new Error('Doublespend?');
    }

    const insValue = unspents.reduce(sumTxsOuts, 0);
    const outsValue = tx.outs.reduce(sumOuts, 0);

    if (insValue !== outsValue) {
      throw new Error('Ins and outs values are mismatch');
    }

    unspents.forEach(unspent => {
      unspent.outs.forEach(out => {
        state.balances[out.addr] -= out.value;
      });
      delete state.unspents[unspent.hash];
    });

    tx.outs.forEach(out => {
      state.balances[out.addr] = (state.balances[out.addr] || 0) + out.value;
    });
    state.unspents[tx.hash] = tx;
  }

  state.txHashes.push(tx.hash);
});

app.listen(process.env.PORT || 3000).then(params => console.log(params));
