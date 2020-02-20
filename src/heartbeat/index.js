// # Behavior of the heartbeat service
//
// - If the node **cannot find the heartbeat color in the configuration**,
// there is nothing it can do and the service is **not started**. A node
// operator will need to adjust their configuration and restart the node if
// they want it to start.
// - If the **color is defined in the configuration** but there is **no NFT
// available** for the current account, the heartbeat service **is started**
// - The service will check every `config.heartbeat.period` for an available
// NFT to push forward (default `60000 ms`), and if found it will create a new
// transaction to transfer the NFT to the account defined in `account.address`.
// - If there is an error in pushing forward the NFT transaction, the node will
// try after `config.heartbeat.periodOnError` to send the transaction again
// (default `5000 ms`)
// - If `config.heartbeat.filter` is `true` (this is also the default value),
// calling the RPC `plasma_getUnspent` will filter out the heartbeat NFT of any
// account different from `account.address` from the results.

const { logNode } = require('../utils/debug');

const loop = require('./loop');
const defaults = require('./defaults');

function updateConfig({ heartbeat = {} }) {
  return { ...defaults, ...heartbeat };
}

module.exports = async (bridgeState, sender) => {
  bridgeState.config.heartbeat = updateConfig(bridgeState.config);
  const heartbeatColor = await bridgeState.operatorContract.methods
    .heartbeatColor()
    .call();
  if (heartbeatColor) {
    bridgeState.config.heartbeat.color = heartbeatColor;
    setTimeout(
      () => loop(bridgeState, sender),
      bridgeState.config.heartbeat.period
    );
  } else {
    logNode('Cannot find Heartbeat color, liveliness service not started.');
  }
};
