const { logPeriod } = require('../utils/debug');
const startNewPeriod = require('./periods/startNewPeriod');
const submitPeriod = require('./periods/submitPeriod');

module.exports = async (height, bridgeState) => {
  if (bridgeState.isReplay()) return;

  if (bridgeState.periodProposal) {
    if (bridgeState.lastBlocksRoot === bridgeState.periodProposal.blocksRoot) {
      logPeriod('Period is found onchain', bridgeState.lastPeriodRoot);
      bridgeState.periodProposal = null;
    } else {
      await submitPeriod(bridgeState.periodProposal, bridgeState);
    }
  };

  if (height % 32 === 0) {
    await startNewPeriod(height, bridgeState);
  }
};