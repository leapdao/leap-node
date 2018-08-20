/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
const { getAddress, hexToBase64, base64ToHex } = require('../utils');
const { logValidators } = require('../debug');

const power = v => (typeof v === 'number' ? v : v.power);

/*
 * Removes validators except those having a slot
 */
module.exports = async (state, chainInfo) => {
  const validatorPubKeys = state.slots
    .filter(s => s) // filter undefined slots
    .filter(
      s =>
        s.activationEpoch ? s.activationEpoch - state.epoch.epoch > 2 : true
    )
    .map(s => s.tenderKey.replace('0x', ''))
    .map(hexToBase64);
  // logValidators(state.slots, validatorPubKeys, chainInfo.validators);
  const validatorAddrs = validatorPubKeys.map(key => getAddress(key));

  // Change existing validators
  Object.keys(chainInfo.validators).forEach(addr => {
    const idx = validatorAddrs.findIndex(
      a => a.toLowerCase() === addr.toLowerCase()
    );
    if (idx === -1 && power(chainInfo.validators[addr]) !== 0) {
      chainInfo.validators[addr] = 0;
      logValidators(`Remove 0x${base64ToHex(addr)}`);
    } else if (idx !== -1 && power(chainInfo.validators[addr]) === 0) {
      chainInfo.validators[addr] = 10;
      logValidators(`Add 0x${base64ToHex(addr)}`);
    }
  });

  // Add new validators
  validatorAddrs.forEach((addr, i) => {
    if (chainInfo.validators[addr] === undefined) {
      chainInfo.validators[addr] = {
        address: addr,
        pubKey: {
          data: validatorPubKeys[i],
          type: 'ed25519',
        },
        power: 10,
      };
      logValidators(`Add 0x${base64ToHex(addr)}`);
    }
  });
};

exports.getAddress = getAddress;
