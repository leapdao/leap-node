/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
const { Period } = require('leap-core');
const getActiveSlots = require('../utils/getActiveSlots');

module.exports = function getCurrentSlotId(slots, height) {
  const activeSlots = getActiveSlots(slots);
  const [height32aligned] = Period.periodBlockRange(height);
  const index = Math.floor((height32aligned / 32) % activeSlots.length);
  return activeSlots[index] && activeSlots[index].id;
};
