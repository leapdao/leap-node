const ethUtil = require('ethereumjs-util');

module.exports = (a1, a2) =>
  ethUtil.toChecksumAddress(a1) === ethUtil.toChecksumAddress(a2);
