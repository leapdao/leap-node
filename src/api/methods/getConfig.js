const fs = require('fs');
const { promisify } = require('util');

module.exports = async (bridgeState, app) => {
  const readFile = promisify(fs.readFile);

  const config = {
    exitHandlerAddr: bridgeState.config.exitHandlerAddr,
    bridgeAddr: bridgeState.config.bridgeAddr,
    operatorAddr: bridgeState.config.operatorAddr,
    rootNetwork: bridgeState.config.rootNetwork,
    rootNetworkId: bridgeState.config.rootNetworkId,
    network: bridgeState.config.network,
    networkId: bridgeState.config.networkId,
    eventsDelay: bridgeState.config.eventsDelay,
    bridgeDelay: bridgeState.config.bridgeDelay,
    version: `v${require('../../../package.json').version}`, // eslint-disable-line
  };

  const genesis =
    bridgeState.config.genesis ||
    JSON.parse(await readFile(app.info().genesisPath));
  config.genesis = genesis;

  if (bridgeState.config.peers) {
    config.peers = bridgeState.config.peers;
  }

  const status = await app.status();
  config.p2pPort = app.info().p2pPort;
  config.nodeId = status.node_info.id;

  return config;
};
