/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
const { Period } = require('leap-core');

module.exports = function getCurrentSlotId(slots, height) {
  const activeSlots = slots.filter(s => s);
  const [height32aligned] = Period.periodBlockRange(height);
  const index = Math.floor(height32aligned / 32 % activeSlots.length);
  return activeSlots[index] && activeSlots[index].id;
};