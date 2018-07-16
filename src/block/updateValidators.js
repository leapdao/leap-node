/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
const { getAddress, hexToBase64 } = require('../utils');

/*
 * Removes validators except those having a slot
 */
module.exports = async (chainInfo, slots, bridge) => {
  const lastCompleteEpoch = await bridge.methods.lastCompleteEpoch().call();
  const before = JSON.stringify(chainInfo.validators);

  const validatorPubKeys = slots
    .filter(s => s) // filter undefined slots
    .filter(
      s =>
        s.activationEpoch ? s.activationEpoch - lastCompleteEpoch > 2 : true
    )
    .map(s => s.tenderKey.replace('0x', ''))
    .map(hexToBase64);
  const validatorAddrs = validatorPubKeys.map(key => getAddress(key));

  // Change existing validators
  Object.keys(chainInfo.validators).forEach(addr => {
    const idx = validatorAddrs.findIndex(
      a => a.toLowerCase() === addr.toLowerCase()
    );
    if (idx === -1 && chainInfo.validators[addr].power !== 0) {
      chainInfo.validators[addr] = 0;
    } else if (idx !== -1 && chainInfo.validators[addr].power === 0) {
      chainInfo.validators[addr] = 10;
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
    }
  });
  console.log('############# slot state: ', slots);
  if (before !== JSON.stringify(chainInfo.validators)) {
    console.log(
      '!!!!!!!!!!!!!!!!!!!!!!   VALIDATORS UPDATE !!!!!!!!!!!!!!!!!!!!!!!!!'
    );
    console.log('height: ', chainInfo.height);
    console.log('before: ', before);
    console.log('after: ', JSON.stringify(chainInfo.validators));
    console.log(
      '!!!!!!!!!!!!!!!!!!!!!!   VALIDATORS UPDATE !!!!!!!!!!!!!!!!!!!!!!!!!'
    );
  }
};

exports.getAddress = getAddress;
