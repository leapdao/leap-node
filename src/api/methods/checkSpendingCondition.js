const { Tx } = require('leap-core');
const checkSpendCond = require('../../tx/applyTx/checkSpendCond.js');

module.exports = async (bridgeState, rawTx) => {
  const tx = Tx.fromRaw(rawTx);

  let logOuts;
  try {
    logOuts = await checkSpendCond(bridgeState.currentState, tx, bridgeState);
  } catch (err) {
    // return err + the calculated logOuts <if any>
    return { error: err.toString(), outputs: err.logOuts };
  }

  return { outputs: logOuts };
};
