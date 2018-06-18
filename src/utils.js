/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const ethUtil = require('ethereumjs-util');

const map = mapFn => arr => arr.map(mapFn);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const addrCmp = (a1, a2) =>
  ethUtil.toChecksumAddress(a1) === ethUtil.toChecksumAddress(a2);

exports.map = map;
exports.delay = delay;
exports.addrCmp = addrCmp;
