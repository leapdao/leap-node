const { Block } = require('leap-core');
const txResponse = require('./txResponse');

module.exports = async (db, hash, showFullTxs = false) => {
  if (!hash) return null;
  const blockDoc = await db.getBlock(hash);
  if (!blockDoc) return null;

  const { blockData } = blockDoc;
  const block = Block.fromJSON(blockData);
  const txs = !showFullTxs
    ? block.txHashList
    : await Promise.all(
        block.txList.map((tx, pos) =>
          txResponse(db, tx, block.hash(), block.height, pos)
        )
      );
  return {
    number: `0x${block.height.toString(16)}`,
    hash: block.hash(),
    parentHash: block.parent,
    size: `0x${block.hex().length.toString(16)}`,
    timestamp: `0x${block.timestamp.toString(16)}`,
    transactions: txs,
    uncles: [],
  };
};
