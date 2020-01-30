const startNewPeriod = require('./periods/startNewPeriod');
const submitPeriod = require('./periods/submitPeriod');
const saveSubmission = require('../utils/saveSubmission');

module.exports = async (height, bridgeState) => {
  if (height % 32 === 0) {
    await startNewPeriod(height, bridgeState);
  }

  const { periodProposal } = bridgeState;

  if (!periodProposal) return;

  const submission = bridgeState.submissions[periodProposal.blocksRoot];
  const submissionInDatabase = await bridgeState.db.getPeriodSubmissionFromDb(
    periodProposal.blocksRoot
  );

  if (submission || submissionInDatabase) {
    if (!submissionInDatabase) {
      await saveSubmission(periodProposal, submission, bridgeState.db);
    }
    const { blocksRoot, periodRoot } = submission || submissionInDatabase;
    delete bridgeState.submissions[blocksRoot];
    bridgeState.lastProcessedPeriodRoot = periodRoot;
    bridgeState.periodProposal = null;
  } else if (!periodProposal.txHash) {
    await submitPeriod(periodProposal, bridgeState);
  }
};
