/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Block, Tx } = require('parsec-lib');

module.exports = (state, chainInfo, { node, db }) => {
  const b = new Block(chainInfo.height, {
    timestamp: Math.round(Date.now() / 1000),
  });
  state.mempool.map(Tx.fromJSON).forEach(b.addTx.bind(b));

  // store block data to db if we didn't see this block before
  if (chainInfo.height > node.lastBlockSynced) {
    db.storeBlock(b).then(() => {
      node.lastBlockSynced = chainInfo.height;
    });
  }
  node.currentPeriod.addBlock(b);
  state.mempool = [];
};
