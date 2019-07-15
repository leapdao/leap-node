const { Tx, Type, Util } = require('leap-core');
const { EMPTY_ADDRESS } = require('../../../utils/constants');

const txValue = (tx, prevTx) => {
  // assuming first output is transfer, second one is change
  if (tx.outputs && tx.outputs.length > 0) {
    return {
      value: tx.outputs[0].value,
      color: tx.outputs[0].color,
    };
  }

  if (tx.type === Type.EXIT && prevTx) {
    const output = prevTx.outputs[tx.inputs[0].prevout.index];
    return {
      value: output.value,
      color: output.color,
    };
  }

  return { value: 0, color: 0 };
};

module.exports = async (db, tx) => {
  let prevTx = null;
  let from = EMPTY_ADDRESS;
  if (tx.inputs && tx.inputs.length > 0 && tx.inputs[0].prevout) {
    const prevTxHash = tx.inputs[0].prevout.hash;
    const outputIndex = tx.inputs[0].prevout.index;
    const txDoc = await db.getTransaction(Util.toHexString(prevTxHash));
    if (txDoc) {
      prevTx = Tx.fromJSON(txDoc.txData);
      from = prevTx.outputs[outputIndex].address;
    }
  }

  const { value, color } = txValue(tx, prevTx);

  const to =
    tx.outputs && tx.outputs.length ? tx.outputs[0].address : EMPTY_ADDRESS;

  return {
    value,
    color,
    from,
    to,
  };
};
