/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('leap-core');

module.exports = (state, tx, bridgeState) => {
  if (tx.type !== Type.EPOCH_LENGTH) {
    throw new Error('epochLength tx expected');
  }

  if (
    state.epoch.epochLengthIndex + 1 !==
    bridgeState.epochLengths.length - 1
  ) {
    throw new Error('Unknown epochLength change');
  }

  if (
    bridgeState.epochLengths[state.epoch.epochLengthIndex + 1] !==
    tx.options.epochLength
  ) {
    throw new Error('Wrong epoch length');
  }

  state.epoch.epochLengthIndex += 1;
  state.epoch.epochLength = tx.options.epochLength;
};
