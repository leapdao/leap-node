const { Tx } = require('leap-core');
const sendTx = require('../../txHelpers/sendTx');

jest.mock('../../txHelpers/sendTx');

module.exports = async (lotionPort, rawTx) => {
  const data = Buffer.from(rawTx.data);
  const tx = Tx.fromRaw(data);
  await sendTx(lotionPort, `0x${data.toString('hex')}`);
  return tx.hash();
};
