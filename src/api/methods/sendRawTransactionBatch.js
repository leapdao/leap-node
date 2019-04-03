const { Tx } = require('leap-core');
const sendTx = require('../../txHelpers/sendTx');

module.exports = async (tendermintPort, ...txs) => {
  const len = txs.length;

  for (let i = 0; i < len; i++) {
    await sendTx(tendermintPort, txs[i]);
  }

  return len;
};
