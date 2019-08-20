const { Block } = require('leap-core');
const { EMPTY_ADDRESS } = require('../../utils/constants');
const txResponse = require('./txResponse');

const NULL_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
const NA = 0;

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
    parentHash: NULL_HASH,
    difficulty: NA,
    gasLimit: NA,
    gasUsed: NA,
    miner: EMPTY_ADDRESS,
    extraData: NA,
    size: `0x${block.hex().length.toString(16)}`,
    timestamp: `0x${block.timestamp.toString(16)}`,
    transactions: txs,
    uncles: [],
  };
};
