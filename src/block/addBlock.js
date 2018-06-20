/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Block, Tx } = require('parsec-lib');

module.exports = async (state, chainInfo, { account, node }) => {
  const b = new Block(chainInfo.height);
  b.addTx(Tx.coinbase(1, account.address));
  state.mempool.forEach(tx => b.addTx(Tx.fromJSON(tx)));
  node.currentPeriod.addBlock(b);
  state.mempool = [];
};
