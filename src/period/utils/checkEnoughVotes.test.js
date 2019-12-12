/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const checkEnoughVotes = require('./checkEnoughVotes');
const { range } = require('../../utils');

const ADDR = '0xb8205608d54cb81f44f263be086027d8610f3c94';
const TENDER_KEY = '0x7640D69D9EDB21592CBDF4CC49956EA53E59656FC2D8BBD1AE3F427BF67D47FA'.toLowerCase();

const PERIOD_ROOT = '0x123';

const slots = num =>
  range(0, num - 1).map(id => ({
    id,
    tenderKey: TENDER_KEY,
    signerAddr: ADDR,
    eventsCount: 1,
  }));

const state = (slotsNumber) => ({
  slots: slots(slotsNumber),
});

const bridgeState = (votesNumber) => ({
  periodVotes: {
    [PERIOD_ROOT]: votesNumber > 0 ? range(0, votesNumber - 1) : null,
  },
});

describe('checkEnoughVotes', () => {
  test('3/4 is enough', () => {
    expect(checkEnoughVotes('0x123', state(4), bridgeState(3))).toEqual({
      result: true,
      votes: 3,
      needed: 3,
    });
  });

  test('2/4 is not enough', () => {
    expect(checkEnoughVotes('0x123', state(4), bridgeState(2))).toEqual({
      result: false,
      votes: 2,
      needed: 3,
    });
  });

  test('2/3 is not enough', () => {
    expect(checkEnoughVotes('0x123', state(3), bridgeState(2))).toEqual({
      result: false,
      votes: 2,
      needed: 3,
    });
  });

  test('3/3 is enough', () => {
    expect(checkEnoughVotes('0x123', state(3), bridgeState(3))).toEqual({
      result: true,
      votes: 3,
      needed: 3,
    });
  });

  test('0/2 is not enough', () => {
    expect(checkEnoughVotes('0x123', state(2), bridgeState(0))).toEqual({
      result: false,
      votes: 0,
      needed: 2,
    });
  });
});
