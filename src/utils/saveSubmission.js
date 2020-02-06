/**
 * Copyright (c) 2020-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Period } = require('leap-core');
const { logPeriod } = require('./debug');

module.exports = async (periodProposal, submission, db) => {
  const dataToSave = {
    ...submission,
    prevPeriodRoot: periodProposal.prevPeriodRoot,
  };
  logPeriod('[submitPeriod] Saving period data into db:', dataToSave);
  const blockHeight = periodProposal.height - 1;
  const [periodStartHeight] = Period.periodBlockRange(blockHeight);
  await db.storeSubmission(periodStartHeight, dataToSave);
};
