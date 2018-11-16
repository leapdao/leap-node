/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('leap-core');
const { checkInsAndOuts } = require('./utils');

module.exports = (state, tx, bridgeState) => {
  if (tx.type !== Type.CONSOLIDATE) {
    throw new Error('Consolidate tx expected');
  }

  if (tx.inputs.length <= 1) {
    throw new Error('Consolidate tx should have > 1 input');
  }

  if (tx.outputs.length !== 1) {
    throw new Error('Consolidate tx should have only 1 output');
  }

  checkInsAndOuts(
    tx,
    state,
    bridgeState,
    ({ address }) => address === tx.outputs[0].address
  );
};
