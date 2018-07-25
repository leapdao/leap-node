const utils = require('ethereumjs-util');

module.exports = function getAddress(pubkey) {
  const bytes = pubkey.startsWith('0x')
    ? Buffer.from(pubkey.replace('0x', ''), 'hex')
    : Buffer.from(pubkey, 'base64');
  const hash = utils.sha256(bytes).slice(0, 20);
  return hash.toString('base64');
};
