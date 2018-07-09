/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('parsec-lib');

module.exports = (state, tx) => {
  if (tx.type !== Type.COMP_RESP) {
    throw new Error('Computation response tx expected');
  }

  if (tx.inputs.length !== 1) {
    throw new Error('Computation response should have only 1 input');
  }

  if (tx.outputs.length < 1) {
    throw new Error('Computation response should have 1+ outputs');
  }
};
