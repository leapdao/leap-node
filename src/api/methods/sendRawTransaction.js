const { Tx } = require('leap-core');
const sendTx = require('../../txHelpers/sendTx');

module.exports = async (tendermintPort, rawTx) => {
  const tx = Tx.fromRaw(rawTx);
  const resp = await sendTx(tendermintPort, rawTx);
  const hash = resp.result.check_tx.code ? resp.result.check_tx.log : tx.hash();
  return hash;
};
