/**
 * Copyright (c) 2019-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const isAlreadyVoted = require('./isAlreadyVoted');

const proposalWithVotes = (votes) => ({
  blocksRoot: '0x123',
  votes,
});

describe('isAlreadyVoted', () => {

  test('vote is present', () => {
    expect(isAlreadyVoted('0x123', 0, proposalWithVotes([0,1]))).toBe(true);
  });

  test('no vote', () => {
    expect(isAlreadyVoted('0x123', 0, proposalWithVotes([]))).toBe(false);
    expect(isAlreadyVoted('0x123', 2, proposalWithVotes([0,1]))).toBe(false);
  });

  test('votes for different blocks root', () => {
    expect(isAlreadyVoted('0x456', 0, proposalWithVotes([0,1]))).toBe(false);
  });

});