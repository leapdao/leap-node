const lotion = require('lotion');
const { Tx, Type } = require('parsec-lib');

// const bridgeAddr = '0xa0a368325920b028e4da0ee2d7ccd8468b7ad1ee';

const app = lotion({
  initialState: {
    balances: {}, // stores account balances
    unspent: {}, // stores txs with unspent outputs (deposits, transfers)
  },
  target: 'tcp://localhost:46657',
  abciPort: 46658,
});

app.use((state, rawTx) => {
  const tx = Tx.parse(rawTx).toJSON();
  if (tx.type !== Type.DEPOSIT && tx.type !== Type.TRANSFER) {
    throw new Error('Unsupported tx type. Only deposits and transfers');
  }

  if (tx.type === Type.DEPOSIT) {
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
});
