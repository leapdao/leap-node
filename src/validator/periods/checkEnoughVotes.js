/**
 * Copyright (c) 2019-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Checks if a given period root voted for by at least 2/3 of validator set
 * @returns {Object} Object with results like
 * { result:boolean, votes:number, needed:number }
 * where
 * - `votes` is a number of votes for a given period,
 * - `needed` is a minimum number of votes needed for consensus
 */
module.exports = (blocksRoot, bridgeState) => {
  const { periodProposal, currentState } = bridgeState;
  const slots = currentState.slots || [];

  const votes = periodProposal && periodProposal.blocksRoot === blocksRoot ? periodProposal.votes.length : 0;
  const needed = Math.floor((slots.length * 2) / 3) + 1;

  return {
    result: votes >= needed,
    votes,
    needed,
  };
};
