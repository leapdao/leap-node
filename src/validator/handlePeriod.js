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

  if (submission || submissionInDatabase) {
    if (!submissionInDatabase) {
      await bridgeState.saveSubmission(periodProposal, submission);
    }
    const { blocksRoot, periodRoot } = submission || submissionInDatabase;
    delete bridgeState.submissions[blocksRoot];
    bridgeState.lastProcessedPeriodRoot = periodRoot;
    bridgeState.periodProposal = null;
  } else if (!periodProposal.txHash) {
    await submitPeriod(periodProposal, bridgeState);
  }
};
