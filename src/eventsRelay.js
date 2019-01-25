/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-await-in-loop, default-case */

const { Tx, Input, Outpoint } = require('leap-core');
const { BigInt } = require('jsbi');
const TinyQueue = require('tinyqueue');

const sendTx = require('./txHelpers/sendTx');
const { handleEvents } = require('./utils');

module.exports = class EventsRelay {
  constructor(delay, txServerPort) {
    this.relayBuffer = new TinyQueue([], (a, b) => {
      return a.blockNumber - b.blockNumber;
    });
    this.relayDelay = delay;

    this.txServerPort = txServerPort;
    this.onNewBlock = this.onNewBlock.bind(this);
  }
  s;
  async onNewBlock(blockNumber) {
    if (this.relayBuffer.length === 0) {
      return;
    }

    const events = [];

    while (
      this.relayBuffer.peek().blockNumber <=
      blockNumber - this.relayDelay
    ) {
      const event = this.relayBuffer.pop();

      events.push(event);

      if (this.relayBuffer.length === 0) {
        break;
      }
    }

    const handleJoin = async event => {
      const {
        slotId,
        tenderAddr,
        eventCounter,
        signerAddr,
      } = event.returnValues;
      const tx = Tx.validatorJoin(slotId, tenderAddr, eventCounter, signerAddr);
      await sendTx(this.txServerPort, tx.hex());
    };

    const handler = handleEvents({
      NewDeposit: async ({ returnValues: event }) => {
        const color = Number(event.color);
        const value = BigInt(event.amount);
        const tx = Tx.deposit(event.depositId, value, event.depositor, color);
        await sendTx(this.txServerPort, tx.hex());
      },
      EpochLength: async event => {
        const { epochLength } = event.returnValues;
        const tx = Tx.epochLength(Number(epochLength));
        await sendTx(this.txServerPort, tx.hex());
      },
      ExitStarted: async event => {
        const { txHash, outIndex } = event.returnValues;
        const tx = Tx.exit(new Input(new Outpoint(txHash, Number(outIndex))));
        await sendTx(this.txServerPort, tx.hex());
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
        await sendTx(this.txServerPort, tx.hex());
      },
    });

    await handler(events);
  }
};
