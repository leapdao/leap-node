/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('parsec-lib');

module.exports = (state, tx) => {
  if (tx.type !== Type.VALIDATOR_LOGOUT) {
    throw new Error('validatorJoin tx expected');
  }

  if (
    state.slots[tx.options.slotId] &&
    tx.options.eventsCount !== state.slots[tx.options.slotId].eventsCount + 1
  ) {
    throw new Error('eventsCount expected to be x + 1');
  }

  if (!state.slots[tx.options.slotId]) {
    throw new Error(`Slot ${tx.options.slotId} is empty`);
  }

  state.slots[tx.options.slotId].activationEpoch = tx.options.activationEpoch;
  state.slots[tx.options.slotId].eventsCount = tx.options.eventsCount;
  state.slots[tx.options.slotId].newSigner = tx.options.newSigner;
};
