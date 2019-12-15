const { isValidAddress } = require('ethereumjs-util');
const { omit } = require('lodash');
const getColor = require('./getColor');
const { filterUnspent } = require('../../utils');

function othersHeartbeatUtxos(bridgeState) {
  if (bridgeState.config.heartbeatColor !== undefined && bridgeState.account) {
    const {
      currentState: { unspent },
      account: { address },
      config: { heartbeatColor },
    } = bridgeState;
    return Object.keys(unspent).filter(
      k =>
        unspent[k] &&
        unspent[k].address.toLowerCase() !== address.toLowerCase() &&
        Number(unspent[k].color) === Number(heartbeatColor)
    );
  }
  return [];
}

module.exports = async (bridgeState, address, colorOrAddress) => {
  const unspent = omit(bridgeState.currentState.unspent, [
    ...Object.keys(bridgeState.exitingUtxos),
    ...othersHeartbeatUtxos(bridgeState),
  ]);

  let color = colorOrAddress;
  if (isValidAddress(colorOrAddress)) {
    color = await getColor(bridgeState, colorOrAddress);
  }
  return filterUnspent(unspent, address, color);
};
