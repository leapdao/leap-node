/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
const range = require('./range');

module.exports = async bridge => {
  const epochLength = await bridge.methods.epochLength().call();
  const slots = await Promise.all(
    range(0, epochLength - 1).map(slotId => bridge.methods.slots(slotId).call())
  );

  return slots.map(
    (
      {
        owner,
        stake,
        signer,
        tendermint,
        activationEpoch,
        newOwner,
        newStake,
        newSigner,
        newTendermint,
      },
      i
    ) => ({
      id: i,
      owner,
      stake,
      signerAddr: signer,
      tenderKey: tendermint,
      activationEpoch,
      newOwner,
      newStake,
      newSigner,
      newTendermint,
    })
  );
};
