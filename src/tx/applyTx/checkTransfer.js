/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('leap-core');
const { checkInsAndOuts } = require('./utils');

module.exports = (state, tx, bridgeState) => {
  if (tx.type !== Type.TRANSFER) {
    throw new Error('Transfer tx expected');
  }

  checkInsAndOuts(
    tx,
    state,
    bridgeState,
    ({ address }, i) => address === tx.inputs[i].signer
  );
};
