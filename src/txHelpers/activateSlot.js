/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { sendTransaction } = require('../utils');

module.exports = async (slotId, { web3, bridge, account }) => {
  const txHash = await sendTransaction(
    web3,
    bridge.methods.activate(slotId),
    bridge.options.address,
    account
  );
  console.log('activation txHash: ', txHash);
};
