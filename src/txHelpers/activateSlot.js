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
    bridgeState.operatorContract.methods.activate(slotId),
    bridgeState.operatorContract.options.address,
    bridgeState.account
  );
};
