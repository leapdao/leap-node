const { Tx } = require('leap-core');
const { bufferToHex } = require('ethereumjs-util');

module.exports = async (db, tx) => {
  if (tx.inputs && tx.inputs.length > 0 && tx.inputs[0].prevout) {
    const prevTxHash = bufferToHex(tx.inputs[0].prevout.hash);
    const txDoc = await db.getTransaction(prevTxHash);
    if (txDoc) {
      return Tx.fromJSON(txDoc.txData);
    }
  }

  return null;
};
