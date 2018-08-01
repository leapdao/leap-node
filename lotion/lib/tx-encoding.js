const vstruct = require('varstruct');
const { stringify, parse } = require('deterministic-json');

const TxStruct = vstruct([
  { name: 'data', type: vstruct.VarString(vstruct.UInt32BE) },
  { name: 'nonce', type: vstruct.UInt32BE },
]);

exports.decode = txBuffer => {
  const decoded = TxStruct.decode(txBuffer);
  const tx = parse(decoded.data);
  return tx;
};
exports.encode = (txData, nonce) => {
  const data = stringify(txData);
  const bytes = TxStruct.encode({ nonce, data });
  return bytes;
};
