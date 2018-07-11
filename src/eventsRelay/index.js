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

module.exports = async (txServerPort, web3, bridge) => {
  const handleDeposit = async event => {
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
  };

  const handleExit = async event => {
    const { txHash, outIndex } = event.returnValues;
    const tx = Tx.exit(new Input(new Outpoint(txHash, Number(outIndex))));
    await sendTx(txServerPort, tx.hex());
  };

  const handleJoin = async event => {
    const { slotId, tenderAddr, eventCounter } = event.returnValues;
    const tx = Tx.validatorJoin(slotId, tenderAddr, eventCounter);
    await sendTx(txServerPort, tx.hex());
  };

  const handleLogout = async event => {
    const { slotId, tenderAddr, eventCounter, epoch } = event.returnValues;
    const tx = Tx.validatorLogout(
      slotId,
      tenderAddr,
      eventCounter,
      Number(epoch) + 1
    );
    await sendTx(txServerPort, tx.hex());
  };

  const handleEvents = async contractEvents => {
    for (const event of contractEvents) {
      switch (event.event) {
        case 'NewDeposit':
          await handleDeposit(event);
          break;
        case 'ExitStarted':
          await handleExit(event);
          break;
        case 'ValidatorJoin':
          await handleJoin(event);
          break;
        case 'ValidatorLogout':
          await handleLogout(event);
          break;
      }
    }
    return undefined;
  };

  const eventSubscription = new ContractEventsSubscription(web3, bridge);
  const events = await eventSubscription.init();
  handleEvents(events);
  eventSubscription.on('events', handleEvents);

  return eventSubscription;
};
