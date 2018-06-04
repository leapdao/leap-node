const { Type, Outpoint } = require('parsec-lib');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const sumOuts = (value, out) => value + out.value;

module.exports = async (state, tx) => {
  if (
    tx.type !== Type.DEPOSIT &&
    tx.type !== Type.EXIT &&
    tx.type !== Type.TRANSFER
  ) {
    throw new Error('Unsupported tx type. Only deposits, exits and transfers');
  }

  tx.inputs.forEach(input => {
    const outpointId = input.prevout.hex();
    if (!state.unspent[outpointId]) {
      throw new Error('Trying to spend non-existing output');
    }
  });

  if (tx.type === Type.DEPOSIT) {
    // check deposit from contract here
    await delay(200); // simulates network (contract calls, etc)
  }

  if (tx.type === Type.EXIT) {
    // check exit from contract here
    await delay(200); // simulates network (contract calls, etc)
  }

  if (tx.type === Type.TRANSFER) {
    const inputTransactions = tx.inputs
      .map(input => state.unspent[input.prevout.hex()])
      .filter(({ address }, i) => {
        if (address !== tx.inputs[i].signer) {
          return false;
        }
        return true;
      });

    if (tx.inputs.length !== inputTransactions.length) {
      throw new Error('Wrong inputs');
    }

    const insValue = inputTransactions.reduce(sumOuts, 0);
    const outsValue = tx.outputs.reduce(sumOuts, 0);

    if (insValue !== outsValue) {
      throw new Error('Ins and outs values are mismatch');
    }
  }

  // remove inputs
  tx.inputs.forEach(input => {
    const outpointId = input.prevout.hex();
    const { address, value } = state.unspent[outpointId];
    state.balances[address] -= value;
    state.unspent[outpointId] = null;
  });

  // add outputs
  tx.outputs.forEach((out, outPos) => {
    const outpoint = new Outpoint(tx.hash(), outPos);
    if (state.unspent[outpoint.hex()] !== undefined) {
      throw new Error('Attempt to create existing output');
    }
    state.balances[out.address] =
      (state.balances[out.address] || 0) + out.value;
    state.unspent[outpoint.hex()] = out;
  });
};
