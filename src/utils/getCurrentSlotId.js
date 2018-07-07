/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { EMPTY_ADDRESS } = require('./constants');

module.exports = function getCurrentSlotId(slots, height) {
  const activeSlots = slots.filter(s => s.owner !== EMPTY_ADDRESS);
  const index = height % activeSlots.length;
  return activeSlots[index] && activeSlots[index].id;
};
