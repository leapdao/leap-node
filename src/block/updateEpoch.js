module.exports = ({ epoch }, chainInfo) => {
  const heightFromLastEpoch = chainInfo.height - epoch.lastEpochHeight;
  if (epoch.epochLength && heightFromLastEpoch >= epoch.epochLength * 32) {
    epoch.lastEpochHeight += epoch.epochLength * 32;
    epoch.epoch += 1;
  }
};
