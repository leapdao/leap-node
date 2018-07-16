/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('parsec-lib');
const { checkInsAndOuts } = require('./utils');

module.exports = (state, tx) => {
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
    ({ address }) => address === tx.outputs[0].address
  );
};
