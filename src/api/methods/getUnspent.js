const { isValidAddress } = require('ethereumjs-util');
const getColor = require('./getColor');
const { filterUnspent } = require('../../utils');

module.exports = async (bridgeState, address, colorOrAddress) => {
  const { unspent } = bridgeState.currentState;
  let color = colorOrAddress;
  if (isValidAddress(colorOrAddress)) {
    color = await getColor(bridgeState, colorOrAddress);
  }
  return filterUnspent(unspent, address, color);
};
