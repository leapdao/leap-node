/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { delay, getSlotByAddr } = require('./utils');
const { Period, Block, Tx } = require('parsec-lib');

module.exports = async (
  state,
  chainInfo,
  { bridge, web3, account, privKey, node }
) => {
  // check if this is a validator
  // how to get address of this validator?

  if (chainInfo.height % 32 === 0) {
    node.previousPeriod = node.currentPeriod;
    node.currentPeriod = new Period();
    const slotId = await getSlotByAddr(web3, bridge, account.address);
    if (slotId !== -1) {
      // how to find slot?
      // define order of submission by list of validator addresses
      // build period and submit
      console.log(
        'Mining new period',
        chainInfo.height,
        node.previousPeriod.merkleRoot()
      );
      console.log('signTransaction', privKey);
      await delay(200); // simulates submit
    }
  }

  const b = new Block('0x01', chainInfo.height);
  b.addTx(Tx.coinbase(1, account.address));
  state.mempool.forEach(b.addTx);
  b.sign(privKey);
  node.currentPeriod.addBlock(b);
  state.mempool = [];
};
