const { unspentForAddress } = require('../../utils');

module.exports = async (bridgeState, address) => {
  const { unspent } = bridgeState.currentState;
  return unspentForAddress(unspent, address);
};
