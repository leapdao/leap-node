/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const getCurrentSlotId = require('./getCurrentSlotId');
const { EMPTY_ADDRESS } = require('./constants');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';

test('no active slots', () => {
  const result = getCurrentSlotId([{ id: 0, owner: EMPTY_ADDRESS }], 1);

  expect(result).toBeUndefined();
});

test('1 active slots', () => {
  const slots = [{ id: 0, owner: EMPTY_ADDRESS }, { id: 1, owner: ADDR_1 }];
  expect(getCurrentSlotId(slots, 1)).toBe(1);
  expect(getCurrentSlotId(slots, 2)).toBe(1);
  expect(getCurrentSlotId(slots, 3)).toBe(1);
});

test('several active slots', () => {
  const slots = [
    { id: 0, owner: EMPTY_ADDRESS },
    { id: 1, owner: ADDR_1 },
    { id: 2, owner: ADDR_1 },
    { id: 3, owner: EMPTY_ADDRESS },
    { id: 4, owner: ADDR_1 },
  ];
  expect(getCurrentSlotId(slots, 1)).toBe(2);
  expect(getCurrentSlotId(slots, 2)).toBe(4);
  expect(getCurrentSlotId(slots, 3)).toBe(1);
  expect(getCurrentSlotId(slots, 4)).toBe(2);
});
