/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const constants = require('./constants');

Object.assign(exports, constants);

exports.handleEvents = require('./handleEvents');
exports.getCurrentSlotId = require('./getCurrentSlotId');
exports.readSlots = require('./readSlots');
exports.sendTransaction = require('./sendTransaction');
exports.addrCmp = require('./addrCmp');
exports.getSlotsByAddr = require('./getSlotsByAddr');
exports.getAuctionedByAddr = require('./getAuctionedByAddr');
exports.unspentForAddress = require('./unspentForAddress');
exports.getAddress = require('./getAddress');
exports.hexToBase64 = require('./hexToBase64');
exports.base64ToHex = require('./base64ToHex');
exports.range = require('./range');
exports.printStartupInfo = require('./printStartupInfo');
exports.getGenesisBlock = require('./getGenesisBlock');

exports.seq = mapFn => async arr => {
  for (const item of arr) {
    await mapFn(item); // eslint-disable-line no-await-in-loop
  }
};
exports.delay = ms => new Promise(resolve => setTimeout(resolve, ms));
