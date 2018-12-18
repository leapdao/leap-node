const { Tx, Type, Util } = require('leap-core');

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

module.exports = async (db, tx, blockHash, height, txPos) => {
  let prevTx = null;
  let from = '';
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

  return {
    value,
    color,
    hash: tx.hash(),
    from,
    raw: tx.hex(),
    blockHash,
    blockNumber: `0x${height.toString(16)}`,
    transactionIndex: txPos,
    to: tx.outputs && tx.outputs.length ? tx.outputs[0].address : null,
    gas: '0x0',
    gasPrice: '0x0',
    nonce: 0,
    input: '0x',
  };
};
