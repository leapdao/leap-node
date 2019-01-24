const { Tx } = require('leap-core');
const sendTx = require('../../txHelpers/sendTx');

module.exports = async (lotionPort, rawTx) => {
  const tx = Tx.fromRaw(rawTx);
  await sendTx(lotionPort, rawTx);
  return tx.hash();
};
