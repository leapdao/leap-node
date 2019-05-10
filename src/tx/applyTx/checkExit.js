/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('leap-core');
const { BigInt, equal } = require('jsbi-utils');
const { addrCmp, isNST } = require('../../utils');

module.exports = (state, tx, bridgeState) => {
  if (tx.type !== Type.EXIT) {
    throw new Error('Exit tx expected');
  }

  if (tx.inputs.length !== 1) {
    throw new Error('Exit tx should have one input');
  }

  const [{ prevout }] = tx.inputs;
  const unspent = state.unspent[prevout.hex()];
  const exit = bridgeState.exits[prevout.getUtxoId()];
  if (
    !unspent ||
    !exit ||
    !addrCmp(exit.exitor, unspent.address) ||
    !equal(BigInt(exit.amount), BigInt(unspent.value)) ||
    Number(exit.color) !== unspent.color ||
    // only NSTs can have data
    (isNST(exit.color) && exit.data !== unspent.data)
  ) {
    throw new Error('Trying to submit incorrect exit');
  }
};
