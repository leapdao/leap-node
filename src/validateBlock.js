/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Period, Block, Tx } = require('parsec-lib');
const { delay, getSlotsByAddr, sendTransaction } = require('./utils');

module.exports = async (
  state,
  chainInfo,
  { bridge, web3, account, privKey, node }
) => {
  if (chainInfo.height % 32 === 0) {
    node.previousPeriod = node.currentPeriod;
    node.currentPeriod = new Period();
    const slots = await getSlotsByAddr(web3, bridge, account.address);
    if (slots.length > 0) {
      // check if there is current slot in slots array
      // how to find slot?
      // define order of submission by list of validator addresses
      // build period and submit
      sendTransaction(
        web3,
        bridge.methods.submitPeriod(
          slots[0].id,
          node.previousPeriod.merkleRoot()
        ),
        bridge.address,
        privKey
      );
      console.log(
        'Mining new period',
        chainInfo.height,
        node.previousPeriod.merkleRoot()
      );
      await delay(200); // simulates submit
    }
  }

  const b = new Block('0x01', chainInfo.height);
  b.addTx(Tx.coinbase(1, account.address));
  state.mempool.forEach(tx => b.addTx(tx));
  b.sign(privKey);
  node.currentPeriod.addBlock(b);
  state.mempool = [];
};
