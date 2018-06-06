/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { delay, getSlotByAddr } = require('./utils');

module.exports = async (
  state,
  chainInfo,
  { bridge, web3, account, privKey }
) => {
  // check if this is a validator
  // how to get address of this validator?

  if (chainInfo.height % 32 === 0) {
    const slotId = await getSlotByAddr(web3, bridge, account.address);
    if (slotId !== -1) {
      // how to find slot?
      // define order of submission by list of validator addresses
      // build period and submit
      console.log('signTransaction', privKey);
      await delay(200); // simulates submit
      state.mempool = []; // clear mempool
    }
  }
};
