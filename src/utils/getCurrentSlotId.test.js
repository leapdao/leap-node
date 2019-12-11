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

const expectForSlots = (slots, fixtures) => {
  fixtures.forEach(({ height, proposingSlot }) =>
    test(`Period at height ${height} is proposed by slot ${proposingSlot}`, () =>
      expect(getCurrentSlotId(slots, height)).toBe(proposingSlot)
    )
  );
}

describe('one slot', () => {
  const slots = [
    { id: 0, owner: ADDR_1 },
  ];

  expectForSlots(slots, [
    { height: 30, proposingSlot: 0 },
    { height: 31, proposingSlot: 0 },
    { height: 32, proposingSlot: 0 },
    { height: 33, proposingSlot: 0 },
    { height: 63, proposingSlot: 0 },
    { height: 64, proposingSlot: 0 }
  ]);
});

describe('one slot with a gap', () => {
  const slots = [
    undefined,
    { id: 0, owner: ADDR_1 },
  ];

  expectForSlots(slots, [
    { height: 30, proposingSlot: 0 },
    { height: 31, proposingSlot: 0 },
    { height: 32, proposingSlot: 0 },
    { height: 33, proposingSlot: 0 },
    { height: 63, proposingSlot: 0 },
    { height: 64, proposingSlot: 0 }
  ]);
});

describe('two slots', () => {
  const slots = [
    { id: 0, owner: ADDR_1 },
    { id: 1, owner: ADDR_1 },
  ];

  expectForSlots(slots, [
    { height: 30, proposingSlot: 0 },
    { height: 31, proposingSlot: 0 },
    { height: 32, proposingSlot: 1 },
    { height: 33, proposingSlot: 1 },
    { height: 63, proposingSlot: 1 },
    { height: 64, proposingSlot: 0 },
  ]);
});

describe('three slots', () => {
  const slots = [
    { id: 0, owner: ADDR_1 },
    { id: 1, owner: ADDR_1 },
    { id: 2, owner: ADDR_1 },
  ];

  expectForSlots(slots, [
    { height: 30, proposingSlot: 0 },
    { height: 31, proposingSlot: 0 },
    { height: 32, proposingSlot: 1 },
    { height: 33, proposingSlot: 1 },
    { height: 63, proposingSlot: 1 },
    { height: 64, proposingSlot: 2 },
    { height: 65, proposingSlot: 2 },
    { height: 95, proposingSlot: 2 },
    { height: 96, proposingSlot: 0 },
  ]);
});

describe('two slots with a gap', () => {
  const slots = [
    { id: 0, owner: ADDR_1 },
    undefined,
    { id: 2, owner: ADDR_1 },
  ];

  expectForSlots(slots, [
    { height: 30, proposingSlot: 0 },
    { height: 31, proposingSlot: 0 },
    { height: 32, proposingSlot: 2 },
    { height: 33, proposingSlot: 2 },
    { height: 63, proposingSlot: 2 },
    { height: 64, proposingSlot: 0 },
    { height: 65, proposingSlot: 0 },
    { height: 95, proposingSlot: 0 },
    { height: 96, proposingSlot: 2 },
  ]);
});