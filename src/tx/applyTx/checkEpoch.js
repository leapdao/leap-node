/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('parsec-lib');

module.exports = (state, tx) => {
  if (tx.type !== Type.EPOCH) {
    throw new Error('Epoch tx expected');
  }

  if (tx.options.epoch - state.epoch !== 1) {
    throw new Error('Epoch should be increment by 1');
  }

  state.epoch = Number(tx.options.epoch);
};
