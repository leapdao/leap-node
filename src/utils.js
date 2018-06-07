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

const range = (s, e) => Array.from(new Array(e - s + 1), (_, i) => i + s);

const readSlots = async (web3, bridge) => {
  const epochLength = await bridge.methods.epochLength().call();
  return Promise.all(
    range(0, epochLength).map(slotId => bridge.methods.slots(slotId).call())
  );
};

const getSlotByAddr = async (web3, bridge, address) => {
  const slots = await readSlots(web3, bridge);
  return slots.findIndex(slot => addrCmp(slot.signer, address));
};

exports.map = map;
exports.delay = delay;
exports.range = range;
exports.addrCmp = addrCmp;
exports.getSlotByAddr = getSlotByAddr;
