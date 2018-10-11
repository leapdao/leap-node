const { Block } = require('parsec-lib');
const txResponse = require('./txResponse');

module.exports = async (db, hash, showFullTxs = false) => {
  if (!hash) return null;
  const blockDoc = await db.getBlock(hash);
  if (!blockDoc) return null;

  const { blockData, height } = blockDoc;
  const block = Block.fromJSON(blockData);
  const txs = !showFullTxs
    ? block.txHashList
    : await Promise.all(
        block.txList.map((tx, pos) => txResponse(db, tx, hash, height, pos))
      );
  return {
    number: `0x${height.toString(16)}`,
    hash,
    parentHash: block.parent,
    size: `0x${block.hex().length.toString(16)}`,
    timestamp: `0x${block.timestamp.toString(16)}`,
    transactions: txs,
    uncles: [],
  };
};
