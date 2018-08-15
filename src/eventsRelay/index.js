/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-await-in-loop, default-case */

const { Tx, Input, Outpoint } = require('parsec-lib');

const ContractEventsSubscription = require('./ContractEventsSubscription');
const sendTx = require('../txHelpers/sendTx');
const { handleEvents } = require('../utils');

module.exports = async (txServerPort, web3, bridge) => {
  const handleJoin = async event => {
    const { slotId, tenderAddr, eventCounter, signerAddr } = event.returnValues;
    const tx = Tx.validatorJoin(slotId, tenderAddr, eventCounter, signerAddr);
    await sendTx(txServerPort, tx.hex());
  };

  const handler = handleEvents({
    NewDeposit: async event => {
      const deposit = await bridge.methods
        .deposits(event.returnValues.depositId)
        .call();
      const tx = Tx.deposit(
        event.returnValues.depositId,
        Number(deposit.amount),
        deposit.owner,
        Number(deposit.color)
      );
      await sendTx(txServerPort, tx.hex());
    },
    EpochLength: async event => {
      const { epochLength } = event.returnValues;
      const tx = Tx.epochLength(Number(epochLength));
      await sendTx(txServerPort, tx.hex());
    },
    ExitStarted: async event => {
      const { txHash, outIndex } = event.returnValues;
      const tx = Tx.exit(new Input(new Outpoint(txHash, Number(outIndex))));
      await sendTx(txServerPort, tx.hex());
    },
    ValidatorJoin: handleJoin,
    ValidatorUpdate: handleJoin,
    ValidatorLogout: async event => {
      const tx = Tx.validatorLogout(
        event.returnValues.slotId,
        event.returnValues.tenderAddr,
        event.returnValues.eventCounter,
        Number(event.returnValues.epoch) + 1,
        event.returnValues.newSigner
      );
      await sendTx(txServerPort, tx.hex());
    },
  });

  const eventSubscription = new ContractEventsSubscription(web3, bridge);
  const events = await eventSubscription.init();
  await handler(events);
  eventSubscription.on('events', handler);

  return eventSubscription;
};
