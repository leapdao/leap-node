const { Tx } = require('leap-core');
const checkSpendCond = require('../../tx/applyTx/checkSpendCond.js');

module.exports = async (bridgeState, rawTx) => {
  const tx = Tx.fromRaw(rawTx);

  let logOuts;
  try {
    logOuts = await checkSpendCond(bridgeState.currentState, tx, bridgeState);
  } catch (err) {
    return {
      error: err.message ? err.message : JSON.stringify(err),
      outputs: err.logOuts,
    };
  }

  return {
    outputs: logOuts,
  };
};
