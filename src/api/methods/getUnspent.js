const { isValidAddress } = require('ethereumjs-util');
const { omit } = require('lodash');
const getColor = require('./getColor');
const { filterUnspent } = require('../../utils');

module.exports = async (bridgeState, address, colorOrAddress) => {
  const unspent = omit(
    bridgeState.currentState.unspent,
    Object.keys(bridgeState.exitingUtxos)
  );
  let color = colorOrAddress;
  if (isValidAddress(colorOrAddress)) {
    color = await getColor(bridgeState, colorOrAddress);
  }
  return filterUnspent(unspent, address, color);
};
