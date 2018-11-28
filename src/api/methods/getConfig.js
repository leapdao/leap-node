module.exports = async (bridgeState, app) => {
  const config = {
    bridgeAddr: bridgeState.config.bridgeAddr,
    rootNetwork: bridgeState.config.rootNetwork,
    network: bridgeState.config.network,
    networkId: bridgeState.config.networkId,
  };

  if (bridgeState.config.genesis) {
    config.genesis = bridgeState.config.genesis;
  }

  if (bridgeState.config.peers) {
    config.peers = bridgeState.config.peers;
  }

  const status = await app.status();
  config.p2pPort = app.info().p2pPort;
  config.nodeId = status.node_info.id;

  return config;
};
