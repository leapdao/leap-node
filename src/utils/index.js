/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const constants = require('./constants');

Object.assign(exports, constants);

exports.getCurrentSlotId = require('./getCurrentSlotId');
exports.readSlots = require('./readSlots');
exports.sendTransaction = require('./sendTransaction');
exports.addrCmp = require('./addrCmp');
exports.getSlotsByAddr = require('./getSlotsByAddr');
exports.unspentForAddress = require('./unspentForAddress');

exports.seq = mapFn => async arr => {
  for (const item of arr) {
    await mapFn(item); // eslint-disable-line no-await-in-loop
  }
};
exports.delay = ms => new Promise(resolve => setTimeout(resolve, ms));
