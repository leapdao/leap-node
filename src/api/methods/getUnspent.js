const { filterUnspent } = require('../../utils');

module.exports = async (bridgeState, address, color) => {
  const { unspent } = bridgeState.currentState;
  return filterUnspent(unspent, address, color);
};
