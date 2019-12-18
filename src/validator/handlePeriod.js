const { logPeriod } = require('../utils/debug');
const startNewPeriod = require('./periods/startNewPeriod');
const submitPeriod = require('./periods/submitPeriod');

module.exports = async (height, bridgeState) => {
  if (bridgeState.isReplay()) return;

  if (bridgeState.stalePeriodProposal 
    && bridgeState.lastBlocksRoot === bridgeState.stalePeriodProposal.blocksRoot) {
    logPeriod('Found successful submission tx for stale period proposal');
    bridgeState.stalePeriodProposal = null;
  }

  if (bridgeState.periodProposal) {
    if (bridgeState.lastBlocksRoot === bridgeState.periodProposal.blocksRoot) {
      logPeriod('Period is found onchain', bridgeState.lastPeriodRoot);
      bridgeState.periodProposal = null;
    } else if (!bridgeState.periodProposal.txHash) {
      await submitPeriod(bridgeState.periodProposal, bridgeState);
    }
  };

  if (height % 32 === 0) {
    await startNewPeriod(height, bridgeState);
  }
};