const sendTx = require('../../txHelpers/sendTx');

module.exports = async (tendermintPort, ...txs) => {
  const len = txs.length;

  for (let i = 0; i < len; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await sendTx(tendermintPort, txs[i]);
  }

  return len;
};
