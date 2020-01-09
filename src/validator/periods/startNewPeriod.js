const { Period } = require('leap-core');
const { logPeriod } = require('../../utils/debug');
const { getCurrentSlotId, GENESIS } = require('../../utils');
const submitPeriodVote = require('./submitPeriodVote');

module.exports = async (height, bridgeState) => {
  if (height % 32 !== 0 || bridgeState.isReplay()) {
    return;
  }

  // istanbul ignore next
  if (bridgeState.periodProposal) {
    bridgeState.stalePeriodProposal = bridgeState.periodProposal;
    logPeriod(
      "WARNING: period proposal already exists. Probably it wasn't submitted yet"
    );
  }

  const currentPeriodBlocksRoot = bridgeState.currentPeriod.merkleRoot();
  logPeriod(
    'Creating new period. Previous period blocks root: ',
    currentPeriodBlocksRoot
  );

  const proposerSlotId = getCurrentSlotId(
    bridgeState.currentState.slots,
    height
  );

  bridgeState.periodProposal = {
    height,
    proposerSlotId,
    votes: [],
    blocksRoot: currentPeriodBlocksRoot,
    prevPeriodRoot: bridgeState.lastPeriodRoot || GENESIS,
  };

  await bridgeState.savePeriodProposals();

  await submitPeriodVote(
    currentPeriodBlocksRoot,
    bridgeState.periodProposal,
    bridgeState
  );

  bridgeState.currentPeriod = new Period(currentPeriodBlocksRoot);
};
