const { Tx, Type } = require('parsec-lib');
const ethUtil = require('ethereumjs-util');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const sumOuts = (value, out) => value + out.value;

module.exports = async (state, { encoded: rawTx }) => {
  const tx = Tx.fromRaw(rawTx);
  if (tx.type !== Type.DEPOSIT && tx.type !== Type.TRANSFER) {
    throw new Error('Unsupported tx type. Only deposits and transfers');
  }

  if (state.txHashes.indexOf(tx.hash()) > -1) {
    throw new Error('Tx already submitted');
  }

  if (tx.type === Type.DEPOSIT) {
    // check deposit from contract here
    await delay(200); // simulates network (contract calls, etc)
    const [{ address, value }] = tx.outputs;
    state.balances[address] = (state.balances[address] || 0) + value;
  }

  if (tx.type === Type.TRANSFER) {
    const inputTransactions = tx.inputs
      .map(input => ({
        prevTx: state.unspent[ethUtil.bufferToHex(input.prevout.hash)],
        outPos: input.prevout.index,
      }))
      .filter(({ prevTx, outPos }, i) => {
        if (!prevTx) {
          return false;
        }

        if (prevTx.outputs[outPos].address !== tx.inputs[i].signer) {
          return false;
        }

        return true;
      });

    if (tx.inputs.length !== inputTransactions.length) {
      throw new Error('Wrong inputs');
    }

    const insValue = inputTransactions
      .map(({ prevTx, outPos }) => prevTx.outputs[outPos])
      .reduce(sumOuts, 0);
    const outsValue = tx.outputs.reduce(sumOuts, 0);

    if (insValue !== outsValue) {
      throw new Error('Ins and outs values are mismatch');
    }

    inputTransactions.forEach(({ prevTx, outPos }) => {
      const out = prevTx.outputs[outPos];
      state.balances[out.address] -= out.value;
      state.unspent[prevTx.hash].outputs[outPos] = null;

      if (state.unspent[prevTx.hash].outputs.filter(a => a).length === 0) {
        delete state.unspent[prevTx.hash];
      }
    });

    tx.outputs.forEach(out => {
      state.balances[out.address] =
        (state.balances[out.address] || 0) + out.value;
    });
  }

  state.unspent[tx.hash()] = tx.toJSON();
  state.txHashes.push(tx.hash());
};
