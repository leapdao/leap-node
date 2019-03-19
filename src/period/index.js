/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const submitPeriod = require('../txHelpers/submitPeriod');
const { logPeriod } = require('../utils/debug');

module.exports = (bridgeState, nodeConfig = {}) => async (rsp, chainInfo) => {
  const height = chainInfo.height - 32;
  if (height === 0) {
    // genesis height doesn't need check
    rsp.status = 1;
    return;
  }

  logPeriod('checkBridge');
  const contractPeriod = await submitPeriod(
    bridgeState.previousPeriod,
    bridgeState.currentState.slots,
    height + bridgeState.checkCallsCount,
    bridgeState,
    nodeConfig
  );

  if (contractPeriod.timestamp === '0') {
    rsp.status = 0;
    bridgeState.checkCallsCount += 1;
  } else {
    rsp.status = 1;
  }
};
