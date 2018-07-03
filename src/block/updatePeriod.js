/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Period } = require('parsec-lib');
const submitPeriod = require('../txHelpers/submitPeriod');

module.exports = async (chainInfo, options) => {
  const { node } = options;
  if (chainInfo.height % 32 === 0) {
    node.previousPeriod = node.currentPeriod;
    node.currentPeriod = new Period(node.previousPeriod.merkleRoot());
    node.checkCallsCount = 0;
    await submitPeriod(node.previousPeriod, chainInfo.height, options);
  }
};
