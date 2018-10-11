const getBlockByHash = require('./getBlockByHash');

module.exports = async (bridgeState, db, heightOrTag, showFullTxs = false) => {
  let height = heightOrTag;
  if (heightOrTag === 'latest') {
    height = bridgeState.blockHeight;
  } else if (typeof height === 'string' && height.indexOf('0x') === 0) {
    height = parseInt(height, 16);
  }
  const blockDoc = await db.getBlock(height);
  return getBlockByHash(db, blockDoc, showFullTxs);
};
