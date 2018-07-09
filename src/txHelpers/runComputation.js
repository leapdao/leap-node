const { Tx, Type, Input, Outpoint, Output } = require('parsec-lib');

module.exports = (state, tx) => {
  if (tx.type === Type.COMP_REQ) {
    const [fOutput] = tx.outputs;
    return Tx.compResponse(
      [new Input(new Outpoint(tx.hash(), 0))],
      [
        new Output({
          storageRoot: state.storageRoots[fOutput.address],
          address: fOutput.address,
          color: fOutput.color,
          value: state.balances[fOutput.color][fOutput.address] + fOutput.value,
        }),
      ]
    );
  }

  throw new Error('Only computation request allowed');
};
