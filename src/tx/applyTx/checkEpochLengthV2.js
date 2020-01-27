/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('leap-core');

module.exports = (state, tx, bridgeState) => {
  if (tx.type !== Type.EPOCH_LENGTH_V2) {
    throw new Error('epochLength tx V2 expected');
  }

  const { blockHeight, epochLength } = tx.options;
  const event = bridgeState.epochLengths.find(
    ([expectedEpochLength, expectedBlockHeight]) =>
      blockHeight &&
      expectedBlockHeight === blockHeight &&
      expectedEpochLength === epochLength
  );

  if (!event) {
    throw new Error('Wrong epoch length');
  }

  state.epoch.epochLength = tx.options.epochLength;
};
