/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('parsec-lib');

module.exports = (state, tx, node) => {
  if (tx.type !== Type.EPOCH_LENGTH) {
    throw new Error('epochLength tx expected');
  }

  if (state.epoch.epochLengthIndex + 1 !== node.epochLengths.length - 1) {
    throw new Error('Unknown epochLength change');
  }

  if (
    node.epochLengths[state.epoch.epochLengthIndex + 1] !==
    tx.options.epochLength
  ) {
    throw new Error('Wrong epoch length');
  }

  state.epoch.epochLengthIndex += 1;
  state.epoch.epochLength = tx.options.epochLength;
};
