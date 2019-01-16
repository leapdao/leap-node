/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-await-in-loop, default-case */

const { Tx, Input, Outpoint, Output } = require('leap-core');

const sendTx = require('./txHelpers/sendTx');
const { handleEvents } = require('./utils');

module.exports = async (txServerPort, bridgeState) => {
  const handleJoin = async event => {
    const { slotId, tenderAddr, eventCounter, signerAddr } = event.returnValues;
    const tx = Tx.validatorJoin(slotId, tenderAddr, eventCounter, signerAddr);
    setTimeout(() => {
      sendTx(txServerPort, tx.hex());
    }, 500);
  };

  const handler = handleEvents({
    NewDeposit: async event => {
      const deposit = await bridgeState.exitHandlerContract.methods
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
      setTimeout(() => {
        sendTx(txServerPort, tx.hex());
      }, 500);
    },
    EpochLength: async event => {
      const { epochLength } = event.returnValues;
      const tx = Tx.epochLength(Number(epochLength));
      setTimeout(() => {
        sendTx(txServerPort, tx.hex());
      }, 500);
    },
    ExitStarted: async event => {
      const { txHash, outIndex } = event.returnValues;
      const tx = Tx.exit(new Input(new Outpoint(txHash, Number(outIndex))));
      setTimeout(() => {
        sendTx(txServerPort, tx.hex());
      }, 500);
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
      setTimeout(() => {
        sendTx(txServerPort, tx.hex());
      }, 500);
    },
  });

  await handler(bridgeState.eventsSubscription.initialEvents);
  bridgeState.eventsSubscription.subscribe(handler);

  return bridgeState.eventsSubscription;
};
