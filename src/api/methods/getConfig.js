module.exports = async bridgeState => {
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

  return config;
};
