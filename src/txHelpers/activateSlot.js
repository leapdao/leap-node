/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { sendTransaction } = require('../utils');

module.exports = (slotId, { web3, bridge, node }) => {
  return sendTransaction(
    web3,
    bridge.methods.activate(slotId),
    bridge.options.address,
    node.account
  );
};
