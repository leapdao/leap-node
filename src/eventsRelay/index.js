/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-await-in-loop, default-case */

const { Tx, Input, Outpoint, Output } = require('leap-core');

const ContractEventsSubscription = require('./ContractEventsSubscription');
const sendTx = require('../txHelpers/sendTx');
const { handleEvents } = require('../utils');

module.exports = async (txServerPort, web3, bridge, exitHandler, operator) => {
  const handleJoin = async event => {
    const { slotId, tenderAddr, eventCounter, signerAddr } = event.returnValues;
    const tx = Tx.validatorJoin(slotId, tenderAddr, eventCounter, signerAddr);
    await sendTx(txServerPort, tx.hex());
  };

  const handler = handleEvents({
    NewDeposit: async event => {
      const deposit = await exitHandler.methods
        .deposits(event.returnValues.depositId)
        .call();
      const color = Number(deposit.color);
      const value = Output.isNFT(color)
        ? deposit.amount
        : Number(deposit.amount);
      const tx = Tx.deposit(
        event.returnValues.depositId,
        value,
        deposit.owner,
        color
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

  const genesisBlock = await bridge.methods.genesisBlockNumber().call();
  const eventSubscription = new ContractEventsSubscription(
    web3,
    [bridge, exitHandler, operator],
    genesisBlock
  );
  const events = await eventSubscription.init();
  await handler(events);
  eventSubscription.on('events', handler);

  return eventSubscription;
};
