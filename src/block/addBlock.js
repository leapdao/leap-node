/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Block, Tx } = require('parsec-lib');

module.exports = (state, chainInfo, { node }) => {
  const b = new Block(chainInfo.height);
  state.mempool.map(Tx.fromJSON).forEach(b.addTx.bind(b));
  node.currentPeriod.addBlock(b);
  state.mempool = [];
};
