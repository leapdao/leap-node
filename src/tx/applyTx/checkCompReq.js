/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('parsec-lib');

module.exports = (state, tx) => {
  if (tx.type !== Type.COMP_REQ) {
    throw new Error('Computation request tx expected');
  }

  if (tx.inputs.length < 2) {
    throw new Error('Computation request should have 2+ inputs');
  }

  const inputs = tx.inputs.map(inp => state.unspent[inp.prevout.hex()]);
  if (inputs.length !== tx.inputs.length) {
    throw new Error('Wrong inputs');
  }

  if (!inputs[0].msgData && !inputs[0].storageRoot) {
    throw new Error(
      'Unknown input. It should be deployment or computation response output'
    );
  }

  if (inputs[0].address !== tx.outputs[0].address) {
    throw new Error('Input and output contract address mismatch');
  }
};
