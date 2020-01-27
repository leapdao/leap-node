/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { Type } = require('leap-core');

module.exports = (state, tx) => {
  if (tx.type !== Type.VALIDATOR_JOIN) {
    throw new Error('validatorJoin tx expected');
  }

  console.log(tx.options.eventsCount);
  console.log(state.slots[tx.options.slotId]);
  if (
    state.slots[tx.options.slotId] &&
    tx.options.eventsCount !== state.slots[tx.options.slotId].eventsCount + 1
  ) {
    throw new Error('eventsCount expected to be x + 1');
  }

  if (!state.slots[tx.options.slotId] && tx.options.eventsCount !== 1) {
    throw new Error('eventsCount should start from 1');
  }

  state.slots[tx.options.slotId] = {
    id: tx.options.slotId,
    tenderKey: tx.options.tenderKey,
    signerAddr: tx.options.signerAddr,
    eventsCount: tx.options.eventsCount,
  };
};
