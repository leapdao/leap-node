module.exports = (state, chainInfo) => {
  const heightFromLastEpoch = chainInfo.height - state.lastEpochHeight;
  if (heightFromLastEpoch >= state.epochLength * 32) {
    state.lastEpochHeight += state.epochLength * 32;
    state.epoch += 1;
  }
};
