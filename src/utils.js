const ethUtil = require('ethereumjs-util');

const map = mapFn => arr => arr.map(mapFn);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const addrCmp = (a1, a2) =>
  ethUtil.toChecksumAddress(a1) === ethUtil.toChecksumAddress(a2);

exports.map = map;
exports.delay = delay;
exports.addrCmp = addrCmp;
