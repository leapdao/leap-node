/* eslint-disable global-require */

module.exports = (bridgeState, db, app, tendermintPort) => {
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
      tendermintPort
    ),
    eth_sendRawTransactionBatch: require('./sendRawTransactionBatch').bind(
      null,
      tendermintPort
    ),
    eth_getTransactionByHash: require('./getTransactionByHash').bind(null, db),
    eth_getTransactionReceipt: require('./getTransactionReceipt').bind(
      null,
      db
    ),
    eth_getBlockByHash: require('./getBlockByHash').bind(null, db),
    eth_getBlockByNumber: require('./getBlockByNumber').bind(
      null,
      bridgeState,
      db
    ),
    eth_call: require('./executeCall').bind(null, bridgeState),
    plasma_getUnsignedTransferTx: require('./getUnsignedTransferTx').bind(
      null,
      bridgeState
    ),
    eth_getCode: require('./getCode').bind(null, bridgeState),
    plasma_unspent: require('./getUnspent').bind(null, bridgeState),
    plasma_getColor: require('./getColor').bind(null, bridgeState),
    plasma_getColors: require('./getColors').bind(null, bridgeState),
    plasma_status: require('./getNodeStatus').bind(null, bridgeState, app),
    plasma_getConfig: require('./getConfig').bind(null, bridgeState, app),
    plasma_getTransactionByPrevOut: require('./getTransactionByPrevOut').bind(
      null,
      db
    ),
    validator_getAddress: require('./getAddress').bind(null, bridgeState, app),
    checkSpendingCondition: require('./checkSpendingCondition.js').bind(
      null,
      bridgeState
    ),
  };

  const methodsWithCallback = Object.keys(nodeApi).reduce((set, key) => {
    set[key] = withCallback(nodeApi[key]);
    return set;
  }, {});

  return { nodeApi, methodsWithCallback };
};
