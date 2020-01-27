const { Period } = require('leap-core');
const { logPeriod } = require('../../utils/debug');
const { getCurrentSlotId } = require('../../utils');
const submitPeriodVote = require('./submitPeriodVote');

module.exports = async (height, bridgeState) => {
  logPeriod(`[startNewPeriod] height: ${height}`);
  if (height % 32 !== 0) {
    return;
  }

  const { periodProposal } = bridgeState;
  let currentPeriodBlocksRoot;
  // periodProposal.height === height only when we replay the current period
  // after node restart. We don't have period data at this point anymore, so we
  // take prev hash from the period proposal
  if (periodProposal && periodProposal.height === height) {
    currentPeriodBlocksRoot = periodProposal.blocksRoot;
    logPeriod(
      `[startNewPeriod] Reusing saved period proposal: ${currentPeriodBlocksRoot}`
    );
  } else {
    currentPeriodBlocksRoot = bridgeState.currentPeriod.merkleRoot();

    if (periodProposal) {
      // by setting stalePeriodProposal here we are enabling checkBridge to
      // stop consensus until stale period proposal is processed
      bridgeState.stalePeriodProposal = bridgeState.periodProposal;
      logPeriod(
        "WARNING: period proposal already exists. Probably it wasn't submitted yet"
      );
    }

    const proposerSlotId = getCurrentSlotId(
      bridgeState.currentState.slots,
      height
    );

    bridgeState.periodProposal = {
      height,
      proposerSlotId,
      votes: [],
      blocksRoot: currentPeriodBlocksRoot,
      prevPeriodRoot: bridgeState.lastProcessedPeriodRoot,
    };

    logPeriod(
      '[startNewPeriod] New period proposal',
      bridgeState.periodProposal
    );

    await bridgeState.saveNodeState();

    await submitPeriodVote(
      currentPeriodBlocksRoot,
      bridgeState.periodProposal,
      bridgeState
    );
  }

  logPeriod(
    '[startNewPeriod] Creating new period. Previous period blocks root:',
    currentPeriodBlocksRoot
  );
  bridgeState.currentPeriod = new Period(currentPeriodBlocksRoot);
};
