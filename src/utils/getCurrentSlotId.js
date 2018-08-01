/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

module.exports = function getCurrentSlotId(slots, height) {
  const activeSlots = slots.filter(s => s);
  const index = height % activeSlots.length;
  return activeSlots[index] && activeSlots[index].id;
};
