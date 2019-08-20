/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Block, Tx } = require('leap-core');

module.exports = async (state, chainInfo, { bridgeState, db }) => {
  const b = new Block(chainInfo.height, {
    timestamp: Math.round(Date.now() / 1000),
  });
  state.mempool.map(Tx.fromJSON).forEach(b.addTx.bind(b));
  bridgeState.currentPeriod.addBlock(b);
  state.mempool = [];

  // store block data to db if we didn't see this block before
  if (chainInfo.height > bridgeState.lastBlockSynced) {
    await db.storeBlock(b, bridgeState.logsCache);
    bridgeState.lastBlockSynced = chainInfo.height;
  }
};
