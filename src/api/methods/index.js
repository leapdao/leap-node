/* eslint-disable global-require */

module.exports = (bridgeState, db, app, lotionPort) => {
  const withCallback = method => {
    return function handler(args, cb) {
      method(...args)
        .then(result => cb(null, result))
        .catch(e => cb(this.error(e.code, e.message)));
    };
  };

  const nodeApi = {
    net_version: async () => bridgeState.networkId,
    eth_blockNumber: require('./getBlockNumber').bind(null, bridgeState),
    eth_getBalance: require('./getBalance').bind(null, bridgeState),
    eth_sendRawTransaction: require('./sendRawTransaction').bind(
      null,
      lotionPort
    ),
    eth_getTransactionByHash: require('./getTransactionByHash').bind(null, db),
    eth_getTransactionReceipt: require('./getTransactionByHash').bind(null, db),
    eth_getBlockByHash: require('./getBlockByHash').bind(null, db),
    eth_getBlockByNumber: require('./getBlockByNumber').bind(
      null,
      bridgeState,
      db
    ),
    eth_call: require('./executeCall').bind(null, bridgeState),
    plasma_unspent: require('./getUnspent').bind(null, bridgeState),
    plasma_getColor: require('./getColor').bind(null, bridgeState),
    plasma_getColors: require('./getColors').bind(null, bridgeState),
    plasma_status: require('./getNodeStatus').bind(null, bridgeState, app),
    plasma_getConfig: require('./getConfig').bind(null, bridgeState),
  };

  const methodsWithCallback = Object.keys(nodeApi).reduce((set, key) => {
    set[key] = withCallback(nodeApi[key]);
    return set;
  }, {});

  return { nodeApi, methodsWithCallback };
};
