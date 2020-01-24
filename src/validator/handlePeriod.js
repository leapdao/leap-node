const { Period } = require('leap-core');
const { logPeriod, logVerbose } = require('../utils/debug');
const startNewPeriod = require('./periods/startNewPeriod');
const submitPeriod = require('./periods/submitPeriod');

module.exports = async (height, bridgeState) => {
  if (height % 32 === 0) {
    await startNewPeriod(height, bridgeState);
  }

  const { periodProposal } = bridgeState;

  if (!periodProposal) return;

  const submission = bridgeState.submissions[periodProposal.blocksRoot];
  const submissionInDatabase = await bridgeState.getPeriodSubmissionFromDb(
    periodProposal.blocksRoot
  );

  if (submission && !submissionInDatabase) {
    submission.prevPeriodRoot = periodProposal.prevPeriodRoot;
    const { blocksRoot, periodRoot } = submission;

    // check if the period is already onchain
    const submittedPeriod = await bridgeState.bridgeContract.methods
      .periods(periodRoot)
      .call();

    if (submittedPeriod.timestamp === '0') {
      throw new Error(`No period found onchain for blocks root ${periodRoot}`);
    }
    logPeriod('[submitPeriod] period found onchain', periodRoot);

    logPeriod('[submitPeriod] Saving period data into db:', submission);
    const blockHeight = periodProposal.height - 1;
    const [periodStartHeight] = Period.periodBlockRange(blockHeight);
    await bridgeState.db.storeSubmission(periodStartHeight, submission);

    delete bridgeState.submissions[blocksRoot];
    bridgeState.lastProcessedPeriodRoot = periodRoot;
    bridgeState.periodProposal = null;
  }

  if (submissionInDatabase) {
    logVerbose(
      `Proposed period was seen onchain already: ${periodProposal.blocksRoot}`
    );
    bridgeState.lastProcessedPeriodRoot = submissionInDatabase.periodRoot;
    bridgeState.periodProposal = null;
  }

  if (!periodProposal.txHash) {
    await submitPeriod(periodProposal, bridgeState);
  }
};
