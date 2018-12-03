const fs = require('fs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

module.exports = async (bridgeState, app) => {
  const config = {
    bridgeAddr: bridgeState.config.bridgeAddr,
    operatorAddr: bridgeState.config.operatorAddr,
    exitHandlerAddr: bridgeState.config.exitHandlerAddr,
    rootNetwork: bridgeState.config.rootNetwork,
    network: bridgeState.config.network,
    networkId: bridgeState.config.networkId,
  };

  const genesis = JSON.parse(await readFile(app.info().genesisPath));
  config.genesis = genesis;

  if (bridgeState.config.peers) {
    config.peers = bridgeState.config.peers;
  }

  const status = await app.status();
  config.p2pPort = app.info().p2pPort;
  config.nodeId = status.node_info.id;

  return config;
};
