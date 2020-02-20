/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

module.exports = slotIds =>
  slotIds
    .filter(k => k < 256)
    .reduce((cas, slotId) => cas | (1n << BigInt(255 - slotId)), 0n);
