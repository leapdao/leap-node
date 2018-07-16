/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('parsec-lib');

module.exports = async (state, tx, bridge) => {
  if (tx.type !== Type.EXIT) {
    throw new Error('Exit tx expected');
  }

  if (!tx.inputs.length === 1) {
    throw new Error('Exit tx should have one input');
  }

  const [{ prevout }] = tx.inputs;
  const unspent = state.unspent[prevout.hex()];
  const exit = await bridge.methods.exits(prevout.getUtxoId()).call();
  if (
    Number(exit.amount) !== unspent.value ||
    Number(exit.color) !== unspent.color
  ) {
    throw new Error('Trying to submit incorrect exit');
  }
};
