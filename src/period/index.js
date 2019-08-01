/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const submitPeriod = require('../txHelpers/submitPeriod');
const { logPeriod } = require('../utils/debug');

module.exports = (bridgeState, sendDelayed, nodeConfig = {}) => async (
  rsp,
  chainInfo,
  chainHeight
) => {
  const height = chainHeight - 32;

  if (height <= 0 || !bridgeState.previousPeriod) {
    // genesis height doesn't need check
    rsp.status = 1;
    return;
  }

  logPeriod('checkBridge');
  // use a timeout to relax race conditions (if period submission is fast)
  await new Promise(resolve => {
    setTimeout(async () => {
      const contractPeriod = await submitPeriod(
        bridgeState.previousPeriod,
        bridgeState.currentState.slots,
        height + bridgeState.checkCallsCount,
        bridgeState,
        nodeConfig,
        sendDelayed
      );

      if (contractPeriod.timestamp === '0') {
        rsp.status = 0;
        bridgeState.checkCallsCount += 1;
      } else {
        rsp.status = 1;
      }

      resolve();
    }, 300);
  });
};
