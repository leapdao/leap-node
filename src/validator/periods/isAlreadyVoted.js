
module.exports = (blocksRoot, slotId, periodProposal) =>
  periodProposal && periodProposal.blocksRoot === blocksRoot
  && periodProposal.votes.indexOf(slotId) >= 0;