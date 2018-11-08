/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const getCurrentSlotId = require('./getCurrentSlotId');

const ADDR_1 = '0x4436373705394267350db2c06613990d34621d69';

test('no active slots', () => {
  const result = getCurrentSlotId([undefined], 1);

  expect(result).toBeUndefined();
});

test('1 active slots', () => {
  const slots = [undefined, { id: 1, owner: ADDR_1 }];
  expect(getCurrentSlotId(slots, 1)).toBe(1);
  expect(getCurrentSlotId(slots, 2)).toBe(1);
  expect(getCurrentSlotId(slots, 3)).toBe(1);
});

test('several active slots', () => {
  const slots = [
    undefined,
    { id: 1, owner: ADDR_1 },
    { id: 2, owner: ADDR_1 },
    undefined,
    { id: 4, owner: ADDR_1 },
  ];
  expect(getCurrentSlotId(slots, 1)).toBe(2);
  expect(getCurrentSlotId(slots, 2)).toBe(4);
  expect(getCurrentSlotId(slots, 3)).toBe(1);
  expect(getCurrentSlotId(slots, 4)).toBe(2);
});
