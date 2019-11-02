/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('leap-core');

module.exports = (state, tx, bridgeState) => {
  if (tx.type !== Type.EPOCH_LENGTH_V1 && tx.type !== Type.EPOCH_LENGTH_V2) {
    throw new Error('epochLength tx expected');
  }

  if (
    bridgeState.epochLengths[state.epoch.epochLengthIndex + 1] !==
    tx.options.epochLength
  ) {
    throw new Error('Wrong epoch length');
  }

  state.epoch.epochLengthIndex += 1;
  state.epoch.epochLength = tx.options.epochLength;
  bridgeState.epochLength = tx.options.epochLength;
};
