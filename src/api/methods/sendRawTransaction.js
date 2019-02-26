const { Tx } = require('leap-core');
const sendTx = require('../../txHelpers/sendTx');

module.exports = async (tendermintPort, rawTx) => {
  const tx = Tx.fromRaw(rawTx);
  await sendTx(tendermintPort, rawTx);
  return tx.hash();
};
