/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { PubKey } = require('tendermint/lib/types');
const { ripemd160 } = require('tendermint/lib/hash');

const { readSlots, EMPTY_ADDRESS } = require('../utils');

function getAddress(pubkey) {
  const bytes = PubKey.encode(pubkey);
  return ripemd160(bytes).toString('base64');
}

/*
 * Removes validators except those having a slot
 */
module.exports = async (state, chainInfo, { bridge }) => {
  const slots = await readSlots(bridge);
  const validatorPubKeys = slots
    .filter(s => s.owner !== EMPTY_ADDRESS)
    .map(s => s.tendermint.replace('0x', ''))
    .map(addr => Buffer.from(addr, 'hex').toString('base64'));
  const validatorAddrs = validatorPubKeys.map(key =>
    getAddress({
      value: key,
      type: 'ed25519',
    })
  );

  // Change existing validators
  Object.keys(chainInfo.validators).forEach(addr => {
    if (
      validatorAddrs.indexOf(addr) === -1 &&
      chainInfo.validators[addr].power !== 0
    ) {
      chainInfo.validators[addr] = 0;
    } else if (
      validatorAddrs.indexOf(addr) !== -1 &&
      chainInfo.validators[addr].power === 0
    ) {
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
};
