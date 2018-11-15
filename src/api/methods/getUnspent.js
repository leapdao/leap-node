const { unspentForAddress } = require('../../utils');

module.exports = async (bridgeState, address, color) => {
  const { unspent } = bridgeState.currentState;
  return unspentForAddress(unspent, address, color);
};
