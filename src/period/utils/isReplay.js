/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

module.exports = ({ currentPeriod, lastBlocksRoot }) =>
  !currentPeriod
  || !currentPeriod.blockList.length
  || currentPeriod.merkleRoot() === lastBlocksRoot;
