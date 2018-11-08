/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { sendTransaction } = require('../utils');

module.exports = (slotId, bridgeState) => {
  return sendTransaction(
    bridgeState.web3,
    bridgeState.contract.methods.activate(slotId),
    bridgeState.contract.options.address,
    bridgeState.account
  );
};
