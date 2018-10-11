module.exports = async bridgeState => {
  return `0x${bridgeState.blockHeight.toString(16)}`;
};
